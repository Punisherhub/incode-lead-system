const fs = require('fs');
const path = require('path');

// Sistema de monitoramento básico para eventos de alta carga
class EventMonitor {
    constructor() {
        this.metrics = {
            requests: { total: 0, success: 0, error: 0 },
            leads: { total: 0, today: 0 },
            performance: { avgResponseTime: 0, maxResponseTime: 0 },
            errors: [],
            startTime: Date.now()
        };

        this.logPath = path.join(__dirname, '../logs/monitor.log');
        this.lastLog = Date.now();

        // Log de métricas a cada 30 segundos
        setInterval(() => this.logMetrics(), 30000);
    }

    // Middleware para monitorar requisições
    requestMonitor() {
        return (req, res, next) => {
            const startTime = Date.now();
            this.metrics.requests.total++;

            // Log detalhado para endpoints críticos
            if (req.path.includes('/api/leads') || req.path.includes('/api/participacoes')) {
                console.log(`🔍 [${new Date().toISOString()}] ${req.method} ${req.path} - IP: ${req.ip}`);
            }

            // Interceptar resposta
            const originalSend = res.send;
            const monitor = this;
            res.send = function(data) {
                const responseTime = Date.now() - startTime;

                // Atualizar métricas de performance
                monitor.updatePerformanceMetrics(responseTime);

                // Contar sucesso/erro
                if (res.statusCode >= 200 && res.statusCode < 400) {
                    monitor.metrics.requests.success++;
                } else {
                    monitor.metrics.requests.error++;

                    // Log de erro
                    if (res.statusCode >= 500) {
                        monitor.logError(req, res.statusCode, responseTime);
                    }
                }

                // Alerta para resposta lenta
                if (responseTime > 2000) {
                    console.warn(`⚠️ Resposta lenta: ${req.method} ${req.path} - ${responseTime}ms`);
                }

                originalSend.call(this, data);
            };

            next();
        };
    }

    // Atualizar métricas de performance
    updatePerformanceMetrics(responseTime) {
        if (responseTime > this.metrics.performance.maxResponseTime) {
            this.metrics.performance.maxResponseTime = responseTime;
        }

        // Média móvel simples das últimas 100 requisições
        const currentAvg = this.metrics.performance.avgResponseTime;
        const totalRequests = this.metrics.requests.total;
        this.metrics.performance.avgResponseTime =
            ((currentAvg * Math.min(totalRequests - 1, 99)) + responseTime) / Math.min(totalRequests, 100);
    }

    // Registrar novo lead
    recordLead() {
        this.metrics.leads.total++;

        // Verificar se é hoje
        const today = new Date().toDateString();
        const lastLeadDate = this.lastLeadDate || '';

        if (today !== lastLeadDate) {
            this.metrics.leads.today = 1;
            this.lastLeadDate = today;
        } else {
            this.metrics.leads.today++;
        }

        // Alerta para picos de leads
        if (this.metrics.leads.today > 50 && this.metrics.leads.today % 50 === 0) {
            console.log(`🚀 PICO DE LEADS: ${this.metrics.leads.today} leads hoje!`);
        }
    }

    // Log de erro
    logError(req, statusCode, responseTime) {
        const error = {
            timestamp: new Date().toISOString(),
            method: req.method,
            path: req.path,
            statusCode,
            responseTime,
            ip: req.ip,
            userAgent: req.get('User-Agent')
        };

        this.metrics.errors.push(error);

        // Manter apenas os últimos 100 erros
        if (this.metrics.errors.length > 100) {
            this.metrics.errors = this.metrics.errors.slice(-100);
        }

        console.error(`❌ Erro ${statusCode}: ${req.method} ${req.path} - ${responseTime}ms - IP: ${req.ip}`);
    }

    // Log periódico de métricas
    logMetrics() {
        const now = Date.now();
        const uptime = now - this.metrics.startTime;
        const uptimeMinutes = Math.floor(uptime / 60000);

        const metricsLog = {
            timestamp: new Date().toISOString(),
            uptime: `${uptimeMinutes}m`,
            requests: this.metrics.requests,
            leads: this.metrics.leads,
            performance: {
                avgResponseTime: Math.round(this.metrics.performance.avgResponseTime),
                maxResponseTime: this.metrics.performance.maxResponseTime
            },
            errorsLast10min: this.metrics.errors.filter(e =>
                Date.now() - new Date(e.timestamp).getTime() < 600000
            ).length
        };

        // Log no console apenas se houver atividade significativa
        if (this.metrics.requests.total > 0 && (now - this.lastLog) > 300000) { // 5 minutos
            console.log('📊 Status do Sistema:', JSON.stringify(metricsLog, null, 2));
            this.lastLog = now;
        }

        // Salvar em arquivo
        this.saveMetricsToFile(metricsLog);
    }

    // Salvar métricas em arquivo
    saveMetricsToFile(metrics) {
        const logLine = JSON.stringify(metrics) + '\n';

        try {
            fs.appendFileSync(this.logPath, logLine);
        } catch (error) {
            console.error('❌ Erro ao salvar métricas:', error.message);
        }
    }

    // Obter status atual
    getStatus() {
        const now = Date.now();
        const uptime = now - this.metrics.startTime;

        return {
            status: 'online',
            uptime: Math.floor(uptime / 1000), // segundos
            requests: this.metrics.requests,
            leads: this.metrics.leads,
            performance: {
                avgResponseTime: Math.round(this.metrics.performance.avgResponseTime),
                maxResponseTime: this.metrics.performance.maxResponseTime
            },
            recentErrors: this.metrics.errors.filter(e =>
                Date.now() - new Date(e.timestamp).getTime() < 300000 // últimos 5 minutos
            ),
            memory: process.memoryUsage(),
            cpu: process.cpuUsage()
        };
    }

    // Reset de métricas diárias
    resetDailyMetrics() {
        this.metrics.leads.today = 0;
        this.metrics.performance.maxResponseTime = 0;
        console.log('🔄 Métricas diárias resetadas');
    }
}

// Instância singleton
const monitor = new EventMonitor();

// Reset diário às 00:00
const msUntilMidnight = () => {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(now.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    return tomorrow.getTime() - now.getTime();
};

setTimeout(() => {
    monitor.resetDailyMetrics();
    setInterval(() => monitor.resetDailyMetrics(), 24 * 60 * 60 * 1000);
}, msUntilMidnight());

module.exports = monitor;