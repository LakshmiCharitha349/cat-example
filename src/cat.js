import {
  createFileStream,
  createStdinStream,
  copyStreamToStdout,
} from './stream_reader.js';

/**
 * Processes a single file and writes to stdout
 * @param {string} filePath - The path to the file
 * @param {Function} openFn - Function to open files (dependency injection)
 * @param {WritableStream} stdout - The stdout stream (dependency injection)
 * @returns {Promise<{success: boolean, error?: Error}>}
 */
export async function processFile(filePath, openFn, stdout) {
  try {
    const stream = await createFileStream(filePath, openFn);
    await copyStreamToStdout(stream, stdout);
    return { success: true };
  } catch (error) {
    return { success: false, error };
  }
}

/**
 * Reads from stdin and writes to stdout
 * @param {ReadableStream} stdin - The stdin stream (dependency injection)
 * @param {WritableStream} stdout - The stdout stream (dependency injection)
 * @param {WritableStream} stderr - The stderr stream (dependency injection)
 * @returns {Promise<number>} Exit code (0 for success, 1 for error)
 */
export async function readFromStdin(stdin, stdout, stderr) {
  try {
    const stream = createStdinStream(stdin);
    await copyStreamToStdout(stream, stdout);
    return 0;
  } catch (error) {
    const encoder = new TextEncoder();
    const writer = stderr.getWriter();
    await writer.write(encoder.encode(`cat: stdin error: ${error.message}\n`));
    writer.releaseLock();
    return 1;
  }
}

/**
 * Processes multiple files and writes to stdout
 * @param {string[]} filePaths - Array of file paths to process
 * @param {Function} openFn - Function to open files (dependency injection)
 * @param {WritableStream} stdout - The stdout stream (dependency injection)
 * @param {WritableStream} stderr - The stderr stream (dependency injection)
 * @returns {Promise<number>} Exit code (0 for success, 1 for error)
 */
export async function processFiles(filePaths, openFn, stdout, stderr) {
  let hasError = false;
  const encoder = new TextEncoder();

  for (const filePath of filePaths) {
    const result = await processFile(filePath, openFn, stdout);
    if (!result.success) {
      hasError = true;
      const errorMsg =
        result.error instanceof Deno.errors.NotFound
          ? `cat: ${filePath}: No such file or directory\n`
          : `cat: ${filePath}: ${result.error.message}\n`;
      const writer = stderr.getWriter();
      await writer.write(encoder.encode(errorMsg));
      writer.releaseLock();
    }
  }

  return hasError ? 1 : 0;
}

/**
 * Processes files from command line arguments or stdin
 * @param {string[]} args - Command line arguments (file paths)
 * @param {Function} openFn - Function to open files (dependency injection)
 * @param {ReadableStream} stdin - The stdin stream (dependency injection)
 * @param {WritableStream} stdout - The stdout stream (dependency injection)
 * @param {WritableStream} stderr - The stderr stream (dependency injection)
 * @returns {Promise<number>} Exit code (0 for success, 1 for error)
 */
export async function cat(args, openFn, stdin, stdout, stderr) {
  if (args.length === 0) {
    return await readFromStdin(stdin, stdout, stderr);
  }

  return await processFiles(args, openFn, stdout, stderr);
}
