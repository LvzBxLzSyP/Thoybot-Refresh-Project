module.exports = {
    name: 'memusage',
    description: 'Display current memory usage',
    execute(rl, client, args) {
        const memoryUsage = process.memoryUsage();
        
        // Pre-calculate each value and keep two decimal places
        const rss = (memoryUsage.rss / 1024 / 1024).toFixed(2);       // Resident Set Size (RSS)
        const heapTotal = (memoryUsage.heapTotal / 1024 / 1024).toFixed(2); // Total heap memory allocated
        const heapUsed = (memoryUsage.heapUsed / 1024 / 1024).toFixed(2);   // Heap memory currently in use
        const external = (memoryUsage.external / 1024 / 1024).toFixed(2);   // External memory used by V8
        
        // Print memory usage details, each on a separate line for clarity
        infoWithTimestamp(`[Memory] Usage: RSS: ${rss} MB, Heap Total: ${heapTotal} MB,`);
        infoWithTimestamp(`[Memory] Usage: Heap Used: ${heapUsed} MB, External: ${external} MB`);
    }
};