import NotificationScheduler from './notification-scheduler';

/**
 * Script to run notification scheduler jobs
 * This can be called from a cron job or scheduled task
 * Example: node -r ts-node/register scheduler-runner.ts --job=due-date
 */
async function main() {
  try {
    // Parse command line arguments
    const args = process.argv.slice(2);
    const jobTypeArg = args.find(arg => arg.startsWith('--job='));
    const jobType = jobTypeArg ? jobTypeArg.split('=')[1] : 'all';
    
    console.log(`Starting notification scheduler job: ${jobType}`);
    const scheduler = new NotificationScheduler();
    
    let result;
    const startTime = Date.now();
    
    // Run the specified job type
    switch (jobType) {
      case 'due-date':
        result = await scheduler.processDueDateReminders();
        console.log('Due date reminder job completed:', result);
        break;
      case 'overdue':
        result = await scheduler.processOverdueNotices();
        console.log('Overdue notice job completed:', result);
        break;
      case 'reservation-availability':
        result = await scheduler.processReservationAvailability();
        console.log('Reservation availability job completed:', result);
        break;
      case 'reservation-expiration':
        result = await scheduler.processReservationExpirations();
        console.log('Reservation expiration job completed:', result);
        break;
      case 'all':
      default:
        result = await scheduler.processAllNotifications();
        console.log('All notification jobs completed:', result);
        break;
    }
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`Job ${jobType} completed in ${duration}s`);
    
    // Provide summary stats
    const totalProcessed = result.total?.processed || result.processed || 0;
    const totalSent = result.total?.sent || result.sent || 0;
    const totalFailed = result.total?.failed || result.failed || 0;
    
    console.log(`Summary: Processed ${totalProcessed} notifications, sent ${totalSent}, failed ${totalFailed}`);
    
    return { success: true, result };
  } catch (error) {
    console.error('Error running notification scheduler:', error);
    return { success: false, error };
  } finally {
    // Give time for logs to flush
    setTimeout(() => {
      process.exit(0);
    }, 1000);
  }
}

// Run the script if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('Fatal error running scheduler:', error);
    process.exit(1);
  });
}

export default main;
