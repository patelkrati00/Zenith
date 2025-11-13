import { useState, useEffect } from 'react';
import { Activity, Users, Zap, AlertCircle, TrendingUp, Clock } from 'lucide-react';
import './AdminDashboard.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

/**
 * Admin Dashboard Component
 * Displays system metrics, execution history, and analytics
 */
export function AdminDashboard() {
    const [metrics, setMetrics] = useState(null);
    const [history, setHistory] = useState([]);
    const [health, setHealth] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 5000); // Refresh every 5 seconds
        return () => clearInterval(interval);
    }, []);

    async function fetchData() {
        try {
            const [metricsRes, historyRes, healthRes] = await Promise.all([
                fetch(`${API_URL}/monitoring/metrics`),
                fetch(`${API_URL}/monitoring/history?limit=50`),
                fetch(`${API_URL}/monitoring/health`)
            ]);

            if (metricsRes.ok) {
                const data = await metricsRes.json();
                setMetrics(data);
            }

            if (historyRes.ok) {
                const data = await historyRes.json();
                setHistory(data.history || []);
            }

            if (healthRes.ok) {
                const data = await healthRes.json();
                setHealth(data);
            }

            setLoading(false);
        } catch (error) {
            console.error('Failed to fetch dashboard data:', error);
            setLoading(false);
        }
    }

    if (loading) {
        return (
            <div className="admin-dashboard loading">
                <div className="spinner"></div>
                <p>Loading dashboard...</p>
            </div>
        );
    }

    const successRate = metrics?.executions.total > 0
        ? ((metrics.executions.successful / metrics.executions.total) * 100).toFixed(1)
        : 0;

    return (
        <div className="admin-dashboard">
            <div className="dashboard-header">
                <h1>System Dashboard</h1>
                <div className="health-badge" data-status={health?.status}>
                    {health?.status === 'healthy' && '✅ Healthy'}
                    {health?.status === 'degraded' && '⚠️ Degraded'}
                    {health?.status === 'unhealthy' && '❌ Unhealthy'}
                </div>
            </div>

            {/* Stats Grid */}
            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-icon">
                        <Zap size={24} />
                    </div>
                    <div className="stat-content">
                        <div className="stat-label">Total Executions</div>
                        <div className="stat-value">{metrics?.executions.total || 0}</div>
                    </div>
                </div>

                <div className="stat-card success">
                    <div className="stat-icon">
                        <TrendingUp size={24} />
                    </div>
                    <div className="stat-content">
                        <div className="stat-label">Success Rate</div>
                        <div className="stat-value">{successRate}%</div>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon">
                        <Activity size={24} />
                    </div>
                    <div className="stat-content">
                        <div className="stat-label">Active Jobs</div>
                        <div className="stat-value">{metrics?.performance.currentConcurrency || 0}</div>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon">
                        <Clock size={24} />
                    </div>
                    <div className="stat-content">
                        <div className="stat-label">Avg Execution Time</div>
                        <div className="stat-value">
                            {metrics?.performance.averageExecutionTime 
                                ? `${(metrics.performance.averageExecutionTime / 1000).toFixed(2)}s`
                                : '0s'}
                        </div>
                    </div>
                </div>
            </div>

            {/* Language Stats */}
            <div className="section">
                <h2>Executions by Language</h2>
                <div className="language-stats">
                    {Object.entries(metrics?.executions.byLanguage || {}).map(([lang, stats]) => (
                        <div key={lang} className="language-stat">
                            <div className="language-name">{lang}</div>
                            <div className="language-bar">
                                <div 
                                    className="language-bar-fill"
                                    style={{ 
                                        width: `${(stats.total / metrics.executions.total * 100)}%` 
                                    }}
                                />
                            </div>
                            <div className="language-count">
                                {stats.total} ({stats.successful}✓ / {stats.failed}✗)
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Recent Executions */}
            <div className="section">
                <h2>Recent Executions</h2>
                <div className="execution-history">
                    <table>
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Language</th>
                                <th>Status</th>
                                <th>Duration</th>
                                <th>Time</th>
                            </tr>
                        </thead>
                        <tbody>
                            {history.slice(0, 20).map((exec) => (
                                <tr key={exec.id}>
                                    <td className="exec-id">{exec.id.substring(0, 8)}</td>
                                    <td>{exec.language}</td>
                                    <td>
                                        <span className={`status-badge ${exec.status}`}>
                                            {exec.status === 'success' ? '✓' : '✗'} {exec.status}
                                        </span>
                                    </td>
                                    <td>{exec.duration ? `${exec.duration}ms` : '-'}</td>
                                    <td>{new Date(exec.startTime).toLocaleTimeString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* System Info */}
            <div className="section">
                <h2>System Information</h2>
                <div className="system-info">
                    <div className="info-row">
                        <span className="info-label">Uptime:</span>
                        <span className="info-value">
                            {metrics?.system.uptime 
                                ? `${(metrics.system.uptime / 3600).toFixed(2)} hours`
                                : '-'}
                        </span>
                    </div>
                    <div className="info-row">
                        <span className="info-label">Node Version:</span>
                        <span className="info-value">{metrics?.system.nodeVersion}</span>
                    </div>
                    <div className="info-row">
                        <span className="info-label">Platform:</span>
                        <span className="info-value">{metrics?.system.platform}</span>
                    </div>
                    <div className="info-row">
                        <span className="info-label">CPUs:</span>
                        <span className="info-value">{metrics?.system.cpus}</span>
                    </div>
                    <div className="info-row">
                        <span className="info-label">Memory Usage:</span>
                        <span className="info-value">
                            {metrics?.system.totalMemory && metrics?.system.freeMemory
                                ? `${((1 - metrics.system.freeMemory / metrics.system.totalMemory) * 100).toFixed(1)}%`
                                : '-'}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
