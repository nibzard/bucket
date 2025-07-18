#!/bin/bash

# Performance monitoring script for Bucket app
# This script runs the development server and monitors performance metrics

# Configuration
LOG_DIR="./logs"
LOG_FILE="$LOG_DIR/server-$(date +%Y%m%d-%H%M%S).log"
PERFORMANCE_LOG="$LOG_DIR/performance-$(date +%Y%m%d-%H%M%S).log"
PID_FILE="$LOG_DIR/server.pid"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Create logs directory if it doesn't exist
mkdir -p "$LOG_DIR"

# Function to log with timestamp
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$PERFORMANCE_LOG"
}

# Function to clean up processes
cleanup() {
    log "Cleaning up processes..."
    if [ -f "$PID_FILE" ]; then
        PID=$(cat "$PID_FILE")
        if kill -0 "$PID" 2>/dev/null; then
            log "Killing server process $PID"
            kill "$PID"
        fi
        rm -f "$PID_FILE"
    fi
    exit 0
}

# Set up signal handlers
trap cleanup EXIT INT TERM

# Function to monitor system resources
monitor_resources() {
    while true; do
        # Get current time
        TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
        
        # Get CPU and memory usage
        if command -v top >/dev/null 2>&1; then
            CPU_USAGE=$(top -l 1 -s 0 | grep "CPU usage" | awk '{print $3}' | sed 's/%//')
            MEMORY_USAGE=$(top -l 1 -s 0 | grep "PhysMem" | awk '{print $2}' | sed 's/M//')
        else
            CPU_USAGE="N/A"
            MEMORY_USAGE="N/A"
        fi
        
        # Log resource usage
        echo "[$TIMESTAMP] RESOURCES: CPU=${CPU_USAGE}%, Memory=${MEMORY_USAGE}MB" >> "$PERFORMANCE_LOG"
        
        # Check for high resource usage
        if [ "$CPU_USAGE" != "N/A" ] && [ $(echo "$CPU_USAGE > 80" | bc -l) -eq 1 ]; then
            log "HIGH CPU USAGE DETECTED: ${CPU_USAGE}%"
        fi
        
        sleep 10
    done
}

# Function to monitor log file for errors and performance issues
monitor_logs() {
    if [ ! -f "$LOG_FILE" ]; then
        return
    fi
    
    tail -f "$LOG_FILE" | while read line; do
        # Check for errors
        if echo "$line" | grep -qi "error"; then
            echo -e "${RED}ERROR DETECTED:${NC} $line" | tee -a "$PERFORMANCE_LOG"
        fi
        
        # Check for slow operations
        if echo "$line" | grep -qi "slow"; then
            echo -e "${YELLOW}SLOW OPERATION:${NC} $line" | tee -a "$PERFORMANCE_LOG"
        fi
        
        # Check for performance metrics
        if echo "$line" | grep -qi "performance"; then
            echo -e "${BLUE}PERFORMANCE:${NC} $line" | tee -a "$PERFORMANCE_LOG"
        fi
        
        # Check for file operations
        if echo "$line" | grep -qi "file"; then
            echo -e "${GREEN}FILE OPERATION:${NC} $line" | tee -a "$PERFORMANCE_LOG"
        fi
    done
}

# Function to start the development server
start_server() {
    log "Starting development server..."
    
    # Set environment variables for enhanced logging
    export DEBUG_MODE=true
    export NODE_ENV=development
    
    # Start the server in the background and capture PID
    pnpm dev > "$LOG_FILE" 2>&1 &
    SERVER_PID=$!
    echo $SERVER_PID > "$PID_FILE"
    
    log "Development server started with PID: $SERVER_PID"
    log "Server logs: $LOG_FILE"
    log "Performance logs: $PERFORMANCE_LOG"
    
    # Wait for server to start
    sleep 5
    
    # Check if server is running
    if kill -0 "$SERVER_PID" 2>/dev/null; then
        log "Server is running successfully"
        return 0
    else
        log "Server failed to start"
        return 1
    fi
}

# Function to run performance tests
run_performance_tests() {
    log "Running performance tests..."
    
    # Wait for server to be ready
    sleep 10
    
    # Basic HTTP health checks
    log "Running basic health checks..."
    
    # Check homepage
    if curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 | grep -q "200"; then
        log "Homepage: OK"
    else
        log "Homepage: FAILED"
    fi
    
    # Check gallery
    if curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/g | grep -q "200"; then
        log "Gallery: OK"
    else
        log "Gallery: FAILED"
    fi
    
    # Measure response times
    HOMEPAGE_TIME=$(curl -s -o /dev/null -w "%{time_total}" http://localhost:3000)
    GALLERY_TIME=$(curl -s -o /dev/null -w "%{time_total}" http://localhost:3000/g)
    
    log "Response times: Homepage=${HOMEPAGE_TIME}s, Gallery=${GALLERY_TIME}s"
    
    # Check for slow responses
    if [ $(echo "$HOMEPAGE_TIME > 2.0" | bc -l) -eq 1 ]; then
        log "SLOW HOMEPAGE RESPONSE: ${HOMEPAGE_TIME}s"
    fi
    
    if [ $(echo "$GALLERY_TIME > 2.0" | bc -l) -eq 1 ]; then
        log "SLOW GALLERY RESPONSE: ${GALLERY_TIME}s"
    fi
}

# Function to display usage
show_usage() {
    echo "Usage: $0 [OPTIONS]"
    echo "Options:"
    echo "  -h, --help     Show this help message"
    echo "  -t, --test     Run performance tests after starting server"
    echo "  -m, --monitor  Monitor resources and logs continuously"
    echo "  -c, --clean    Clean up old log files"
    echo ""
    echo "Examples:"
    echo "  $0                    # Start server with basic monitoring"
    echo "  $0 --test             # Start server and run performance tests"
    echo "  $0 --monitor          # Full monitoring with resource tracking"
    echo "  $0 --clean            # Clean up old log files"
}

# Function to clean up old log files
clean_logs() {
    log "Cleaning up old log files..."
    find "$LOG_DIR" -name "*.log" -type f -mtime +7 -exec rm {} \;
    find "$LOG_DIR" -name "*.pid" -type f -mtime +1 -exec rm {} \;
    log "Log cleanup completed"
}

# Main execution
main() {
    echo -e "${GREEN}Bucket App Performance Monitor${NC}"
    echo "================================"
    
    # Parse command line arguments
    RUN_TESTS=false
    MONITOR_RESOURCES=false
    CLEAN_LOGS=false
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            -h|--help)
                show_usage
                exit 0
                ;;
            -t|--test)
                RUN_TESTS=true
                shift
                ;;
            -m|--monitor)
                MONITOR_RESOURCES=true
                shift
                ;;
            -c|--clean)
                CLEAN_LOGS=true
                shift
                ;;
            *)
                echo "Unknown option: $1"
                show_usage
                exit 1
                ;;
        esac
    done
    
    # Clean logs if requested
    if [ "$CLEAN_LOGS" = true ]; then
        clean_logs
        exit 0
    fi
    
    # Start the server
    if ! start_server; then
        log "Failed to start server, exiting"
        exit 1
    fi
    
    # Start resource monitoring if requested
    if [ "$MONITOR_RESOURCES" = true ]; then
        monitor_resources &
        MONITOR_PID=$!
        log "Resource monitoring started with PID: $MONITOR_PID"
    fi
    
    # Start log monitoring
    monitor_logs &
    LOG_MONITOR_PID=$!
    log "Log monitoring started with PID: $LOG_MONITOR_PID"
    
    # Run performance tests if requested
    if [ "$RUN_TESTS" = true ]; then
        run_performance_tests
    fi
    
    # Keep the script running
    log "Monitoring active. Press Ctrl+C to stop."
    
    # Wait for server process
    if [ -f "$PID_FILE" ]; then
        wait $(cat "$PID_FILE")
    else
        wait
    fi
}

# Check if bc is available (for floating point arithmetic)
if ! command -v bc >/dev/null 2>&1; then
    echo -e "${YELLOW}Warning: bc not found. Some numeric comparisons may not work.${NC}"
fi

# Run main function
main "$@"