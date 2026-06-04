/**
 * Creates a readable stream from a file path
 * @param {string} path - The path to the file
 * @param {Function} openFn - Function to open the file (dependency injection)
 * @returns {Promise<ReadableStream>} A readable stream
 */
export async function createFileStream(path, openFn = Deno.open) {
  const file = await openFn(path, { read: true });
  return file.readable;
}

/**
 * Creates a readable stream from stdin
 * @param {ReadableStream} stdin - The stdin stream (dependency injection)
 * @returns {ReadableStream} A readable stream
 */

export function createStdinStream(stdin = Deno.stdin.readable) {
  return stdin;
}

/**
 * Copies a readable stream to stdout
 * @param {ReadableStream} stream - The input stream
 * @param {WritableStream} stdout - The stdout stream (dependency injection)
 * @returns {Promise<void>}
 */
export async function copyStreamToStdout(
  stream,
  stdout = Deno.stdout.writable,
) {
  await stream.pipeTo(stdout, { preventClose: true });
}
