import React from 'react';
import { render } from 'ink';
import { ConfigWizard } from '../components/ConfigWizard.js';
import { config, CLIConfig } from '../utils/config.js';

export async function configCommand(options: { get?: string; set?: string; reset?: boolean }): Promise<void> {
  if (options.reset) {
    config.reset();
    console.log('✓ Configuration reset to defaults');
    return;
  }

  if (options.get) {
    const allConfig = config.getAll();
    const value = allConfig[options.get as keyof CLIConfig];
    console.log(`${options.get}: ${value}`);
    return;
  }

  if (options.set) {
    const [key, value] = options.set.split('=');
    if (!key || !value) {
      console.error('Invalid format. Use: --set key=value');
      process.exit(1);
    }
    config.set(key as any, value as any);
    console.log(`✓ ${key} set to ${value}`);
    return;
  }

  // Interactive wizard
  const { waitUntilExit } = render(
    <ConfigWizard
      onComplete={() => {
        console.log('\n✓ Configuration saved successfully');
        process.exit(0);
      }}
    />
  );

  await waitUntilExit();
}
