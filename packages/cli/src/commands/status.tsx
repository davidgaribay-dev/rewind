import React from 'react';
import { render } from 'ink';
import { StatusDisplay } from '../components/StatusDisplay.js';

export async function statusCommand(): Promise<void> {
  const { waitUntilExit } = render(<StatusDisplay />);
  await waitUntilExit();
}
