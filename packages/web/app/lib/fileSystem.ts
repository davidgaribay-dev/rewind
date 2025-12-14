/**
 * File System Access API utilities
 */

export function isFileSystemAccessSupported(): boolean {
  return 'showDirectoryPicker' in window;
}
