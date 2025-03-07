import got from 'got';
import { EventEmitter } from 'events';
class GitRepoAnalyzer extends EventEmitter {
    gitUrl;
    apiUrl;
    isPrivate;
    token;
    httpClient;
    cache;
    cacheTTL;
    pollInterval;
    isPolling;
    constructor(gitUrl, opts) {
        super();
        this.gitUrl = gitUrl;
        this.isPrivate = opts.isPrivate;
        this.token = opts.token;
        this.cache = new Map();
        this.cacheTTL = (opts.cacheTTL || 300) * 1000;
        this.isPolling = false;
        this.apiUrl = this.parseGitUrl(gitUrl);
        this.httpClient = got.extend({
            prefixUrl: this.apiUrl,
            headers: {
                accept: 'application/vnd.github.v3+json',
                ...(this.token && { authorization: `Bearer ${this.token}` }),
            },
            timeout: { request: 10000 },
            retry: {
                limit: 2,
                methods: ['GET'],
            },
        });
        if (opts.pollingInterval) {
            this.startPolling(opts.pollingInterval * 1000);
        }
        this.validateConfig().catch((err) => this.emit('error', err));
    }
    parseGitUrl(url) {
        const match = url.match(/github\.com\/([^/]+)\/([^/.]+)/);
        if (!match)
            throw new Error('Invalid GitHub URL');
        return `https://api.github.com/repos/${match[1]}/${match[2]}`;
    }
    async validateConfig() {
        if (this.isPrivate && !this.token) {
            throw new Error('Private repository requires authentication token');
        }
        try {
            await this.httpClient.get('');
        }
        catch (error) {
            throw new Error(`Failed to connect to repository: ${error.message}`);
        }
    }
    async getCachedOrFetch(key, fetchFn) {
        const cached = this.cache.get(key);
        const now = Date.now();
        if (cached && now - cached.timestamp < this.cacheTTL) {
            return cached.data;
        }
        const data = await fetchFn();
        this.cache.set(key, { data, timestamp: now });
        return data;
    }
    async getLatestCommit() {
        return this.getCachedOrFetch('latestCommit', async () => {
            const response = await this.httpClient.get('commits').json();
            const commit = response[0];
            return {
                sha: commit.sha,
                message: commit.commit.message,
                date: new Date(commit.commit.author.date),
                author: {
                    name: commit.commit.author.name,
                    email: commit.commit.author.email,
                    login: commit.author?.login,
                },
            };
        });
    }
    async getContributors() {
        return this.getCachedOrFetch('contributors', async () => {
            const response = await this.httpClient.get('contributors').json();
            return response.map((c) => ({
                login: c.login,
                contributions: c.contributions,
                avatarUrl: c.avatar_url,
                profileUrl: c.html_url,
            }));
        });
    }
    async getRepoStats() {
        return this.getCachedOrFetch('stats', async () => {
            const response = await this.httpClient.get('').json();
            return {
                forks: response.forks_count,
                stars: response.stargazers_count,
                watchers: response.watchers_count,
                openIssues: response.open_issues_count,
            };
        });
    }
    async getCommitSummary(limit = 10) {
        return this.getCachedOrFetch(`commitSummary-${limit}`, async () => {
            const response = await this.httpClient.get(`commits?per_page=${limit}`).json();
            return response.map((c) => ({
                sha: c.sha,
                message: c.commit.message.split('\n')[0],
                date: new Date(c.commit.author.date),
                author: c.commit.author.name,
            }));
        });
    }
    async getCodeChurn() {
        return this.getCachedOrFetch('codeChurn', async () => {
            const stats = await this.httpClient.get('stats/code_frequency').json();
            const additions = stats.reduce((sum, week) => sum + week[1], 0);
            const deletions = stats.reduce((sum, week) => sum + week[2], 0);
            return { additions, deletions, totalChanges: additions + Math.abs(deletions) };
        });
    }
    async getHealthMetrics() {
        return this.getCachedOrFetch('health', async () => {
            const [issues, prs] = await Promise.all([
                this.httpClient.get('issues').json(),
                this.httpClient.get('pulls').json(),
            ]);
            return {
                avgIssueAge: this.calculateAvgAge(issues),
                avgPrAge: this.calculateAvgAge(prs),
                openPrCount: prs.length,
                openIssueCount: issues.length,
            };
        });
    }
    async getContributionTrends() {
        return this.getCachedOrFetch('trends', async () => {
            const stats = await this.httpClient.get('stats/participation').json();
            return {
                ownerCommits: stats.owner,
                allCommits: stats.all,
                weeklyAverage: stats.all.reduce((a, b) => a + b, 0) / stats.all.length,
            };
        });
    }
    async getFileStructure() {
        return this.getCachedOrFetch('structure', async () => {
            const tree = await this.httpClient.get('git/trees/HEAD?recursive=1').json();
            const files = tree.tree.filter((item) => item.type === 'blob');
            return {
                fileCount: files.length,
                avgFileSize: files.reduce((sum, f) => sum + (f.size || 0), 0) / files.length,
                uniqueExtensions: [...new Set(files.map((f) => f.path.split('.').pop()))].length,
            };
        });
    }
    async getCommitSentiment() {
        return this.getCachedOrFetch('sentiment', async () => {
            const commits = await this.getCommitSummary(50);
            const sentiment = this.analyzeSentiment(commits.map((c) => c.message));
            return sentiment;
        });
    }
    async getDependencies() {
        return this.getCachedOrFetch('dependencies', async () => {
            const contents = await this.httpClient.get('contents').json();
            const packageJson = contents.find((f) => f.name === 'package.json');
            if (!packageJson)
                return { dependencyCount: 0, dependencies: {} };
            const pkg = await this.httpClient.get(packageJson.download_url).json();
            const deps = { ...pkg.dependencies, ...pkg.devDependencies };
            return {
                dependencyCount: Object.keys(deps).length,
                dependencies: deps,
            };
        });
    }
    startPolling(interval) {
        if (this.isPolling)
            return;
        this.isPolling = true;
        this.pollInterval = setInterval(async () => {
            try {
                const [latest, stats] = await Promise.all([this.getLatestCommit(), this.getRepoStats()]);
                this.emit('update', { latestCommit: latest, stats });
            }
            catch (error) {
                this.emit('error', error);
            }
        }, interval);
    }
    stopPolling() {
        if (this.pollInterval) {
            clearInterval(this.pollInterval);
            this.isPolling = false;
        }
    }
    calculateAvgAge(items) {
        if (!items.length)
            return 0;
        const now = Date.now();
        return (items.reduce((sum, item) => {
            return sum + (now - new Date(item.created_at).getTime());
        }, 0) /
            items.length /
            (1000 * 60 * 60 * 24));
    }
    analyzeSentiment(messages) {
        const positiveWords = ['fix', 'improve', 'enhance', 'add', 'new'];
        const negativeWords = ['bug', 'error', 'fail', 'broken', 'issue'];
        let positive = 0;
        let negative = 0;
        messages.forEach((msg) => {
            const words = msg.toLowerCase().split(/\s+/);
            positive += words.filter((w) => positiveWords.includes(w)).length;
            negative += words.filter((w) => negativeWords.includes(w)).length;
        });
        return {
            positiveScore: positive,
            negativeScore: negative,
            overallSentiment: (positive - negative) / (positive + negative) || 0,
        };
    }
}
export { GitRepoAnalyzer };
export default GitRepoAnalyzer;
