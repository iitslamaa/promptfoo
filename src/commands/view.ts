import { getDefaultPort } from '../constants';
import logger from '../logger';
import { startServer } from '../server/server';
import telemetry from '../telemetry';
import { setupEnv } from '../util/index';
import { setConfigDirectoryPath } from '../util/config/manage';
import { BrowserBehavior } from '../util/server';
import type { Command } from 'commander';

export function viewCommand(program: Command) {
  program
    .command('view [directory]')
    .description('Start browser UI')
    .option('-p, --port <number>', 'Port number', getDefaultPort().toString())
    .option('-y, --yes', 'Skip confirmation and auto-open the URL')
    .option('-n, --no', 'Skip confirmation and do not open the URL')
    .option('--print-url', 'Print the URL to stdout (implies --no-open)')
    .option('--filter-description <pattern>', 'Filter evals by description using a regex pattern')
    .option('--env-file, --env-path <path>', 'Path to .env file')
    .action(
      async (
        directory: string | undefined,
        cmdObj: {
          port: number;
          yes: boolean;
          no: boolean;
          printUrl?: boolean;
          printurl?: boolean;
          apiBaseUrl?: string;
          envPath?: string;
          filterDescription?: string;
        } & Command,
      ) => {
        setupEnv(cmdObj.envPath);
        telemetry.record('command_used', {
          name: 'view',
        });

        if (cmdObj.filterDescription) {
          logger.warn(
            'The --filter-description option is deprecated and not longer supported. The argument will be ignored.',
          );
        }

        if (directory) {
          setConfigDirectoryPath(directory);
        }
        // If --print-url is set, imply --no-open
        const shouldPrintUrl: boolean = Boolean((cmdObj as any).printUrl ?? (cmdObj as any).printurl);
        if (shouldPrintUrl) {
          cmdObj.yes = false;
          cmdObj.no = true;
        }
        // Block indefinitely on server
        const browserBehavior = cmdObj.yes
          ? BrowserBehavior.OPEN
          : cmdObj.no
            ? BrowserBehavior.SKIP
            : BrowserBehavior.ASK;
        await startServer(cmdObj.port, browserBehavior);
        if (shouldPrintUrl) {
          const portNum = Number(cmdObj.port);
          // eslint-disable-next-line no-console
          console.log(`http://localhost:${portNum}`);
        }
      },
    );
}
