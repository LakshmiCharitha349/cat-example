import { assertEquals } from 'https://deno.land/std@0.208.0/assert/mod.ts';
import { cat, processFile } from '../src/cat.js';

Deno.test('processFile - successfully processes a file', async () => {
  const mockContent = new TextEncoder().encode('file content');
  const mockReadable = new ReadableStream({
    start(controller) {
      controller.enqueue(mockContent);
      controller.close();
    },
  });

  const mockFile = { readable: mockReadable };
  const mockOpen = async () => mockFile;

  let writtenData = new Uint8Array();
  const mockStdout = new WritableStream({
    write(chunk) {
      const newData = new Uint8Array(writtenData.length + chunk.length);
      newData.set(writtenData);
      newData.set(chunk, writtenData.length);
      writtenData = newData;
    },
  });

  const result = await processFile('test.txt', mockOpen, mockStdout);
  assertEquals(result.success, true);
  assertEquals(writtenData, mockContent);
});

Deno.test('processFile - returns error for non-existent file', async () => {
  const mockOpen = async () => {
    throw new Deno.errors.NotFound('file not found');
  };

  const mockStdout = new WritableStream({
    write() {},
  });

  const result = await processFile('nonexistent.txt', mockOpen, mockStdout);
  assertEquals(result.success, false);
  assertEquals(result.error instanceof Deno.errors.NotFound, true);
});

Deno.test('cat - reads from stdin when no args provided', async () => {
  const mockContent = new TextEncoder().encode('stdin content');
  const mockStdin = new ReadableStream({
    start(controller) {
      controller.enqueue(mockContent);
      controller.close();
    },
  });

  let writtenData = new Uint8Array();
  const mockStdout = new WritableStream({
    write(chunk) {
      const newData = new Uint8Array(writtenData.length + chunk.length);
      newData.set(writtenData);
      newData.set(chunk, writtenData.length);
      writtenData = newData;
    },
  });

  const mockStderr = new WritableStream({
    write() {},
  });

  const exitCode = await cat([], null, mockStdin, mockStdout, mockStderr);
  assertEquals(exitCode, 0);
  assertEquals(writtenData, mockContent);
});

Deno.test('cat - returns error code when stdin fails', async () => {
  const mockStdin = new ReadableStream({
    start(controller) {
      controller.error(new Error('stdin read error'));
    },
  });

  const mockStdout = new WritableStream({
    write() {},
  });

  let stderrOutput = new Uint8Array();
  const mockStderr = new WritableStream({
    write(chunk) {
      const newData = new Uint8Array(stderrOutput.length + chunk.length);
      newData.set(stderrOutput);
      newData.set(chunk, stderrOutput.length);
      stderrOutput = newData;
    },
  });

  const exitCode = await cat([], null, mockStdin, mockStdout, mockStderr);
  assertEquals(exitCode, 1);

  const errorMsg = new TextDecoder().decode(stderrOutput);
  assertEquals(errorMsg.includes('stdin error'), true);
  assertEquals(errorMsg.includes('stdin read error'), true);
});

Deno.test('cat - processes single file successfully', async () => {
  const mockContent = new TextEncoder().encode('file content');
  const mockReadable = new ReadableStream({
    start(controller) {
      controller.enqueue(mockContent);
      controller.close();
    },
  });

  const mockFile = { readable: mockReadable };
  const mockOpen = async () => mockFile;

  let writtenData = new Uint8Array();
  const mockStdout = new WritableStream({
    write(chunk) {
      const newData = new Uint8Array(writtenData.length + chunk.length);
      newData.set(writtenData);
      newData.set(chunk, writtenData.length);
      writtenData = newData;
    },
  });

  const mockStderr = new WritableStream({
    write() {},
  });

  const exitCode = await cat(
    ['test.txt'],
    mockOpen,
    null,
    mockStdout,
    mockStderr
  );
  assertEquals(exitCode, 0);
  assertEquals(writtenData, mockContent);
});

Deno.test('cat - processes multiple files successfully', async () => {
  const files = {
    'file1.txt': new TextEncoder().encode('content1'),
    'file2.txt': new TextEncoder().encode('content2'),
  };

  const mockOpen = async path => {
    const content = files[path];
    const mockReadable = new ReadableStream({
      start(controller) {
        controller.enqueue(content);
        controller.close();
      },
    });
    return { readable: mockReadable };
  };

  let writtenData = new Uint8Array();
  const mockStdout = new WritableStream({
    write(chunk) {
      const newData = new Uint8Array(writtenData.length + chunk.length);
      newData.set(writtenData);
      newData.set(chunk, writtenData.length);
      writtenData = newData;
    },
  });

  const mockStderr = new WritableStream({
    write() {},
  });

  const exitCode = await cat(
    ['file1.txt', 'file2.txt'],
    mockOpen,
    null,
    mockStdout,
    mockStderr
  );
  assertEquals(exitCode, 0);

  const expectedData = new Uint8Array([
    ...files['file1.txt'],
    ...files['file2.txt'],
  ]);
  assertEquals(writtenData, expectedData);
});

Deno.test('cat - returns error code for non-existent file', async () => {
  const mockOpen = async () => {
    throw new Deno.errors.NotFound('file not found');
  };

  const mockStdout = new WritableStream({
    write() {},
  });

  let stderrOutput = new Uint8Array();
  const mockStderr = new WritableStream({
    write(chunk) {
      const newData = new Uint8Array(stderrOutput.length + chunk.length);
      newData.set(stderrOutput);
      newData.set(chunk, stderrOutput.length);
      stderrOutput = newData;
    },
  });

  const exitCode = await cat(
    ['nonexistent.txt'],
    mockOpen,
    null,
    mockStdout,
    mockStderr
  );
  assertEquals(exitCode, 1);

  const errorMsg = new TextDecoder().decode(stderrOutput);
  assertEquals(errorMsg.includes('No such file or directory'), true);
});

Deno.test(
  'cat - processes valid files and reports errors for invalid ones',
  async () => {
    const mockOpen = async path => {
      if (path === 'valid.txt') {
        const content = new TextEncoder().encode('valid content');
        const mockReadable = new ReadableStream({
          start(controller) {
            controller.enqueue(content);
            controller.close();
          },
        });
        return { readable: mockReadable };
      } else {
        throw new Deno.errors.NotFound('file not found');
      }
    };

    let writtenData = new Uint8Array();
    const mockStdout = new WritableStream({
      write(chunk) {
        const newData = new Uint8Array(writtenData.length + chunk.length);
        newData.set(writtenData);
        newData.set(chunk, writtenData.length);
        writtenData = newData;
      },
    });

    let stderrOutput = new Uint8Array();
    const mockStderr = new WritableStream({
      write(chunk) {
        const newData = new Uint8Array(stderrOutput.length + chunk.length);
        newData.set(stderrOutput);
        newData.set(chunk, stderrOutput.length);
        stderrOutput = newData;
      },
    });

    const exitCode = await cat(
      ['valid.txt', 'invalid.txt'],
      mockOpen,
      null,
      mockStdout,
      mockStderr
    );
    assertEquals(exitCode, 1); // Should return error code

    // Valid file content should be written to stdout
    const stdoutText = new TextDecoder().decode(writtenData);
    assertEquals(stdoutText, 'valid content');

    // Error message should be written to stderr
    const stderrText = new TextDecoder().decode(stderrOutput);
    assertEquals(stderrText.includes('invalid.txt'), true);
    assertEquals(stderrText.includes('No such file or directory'), true);
  }
);

Deno.test('cat - handles non-NotFound errors with custom message', async () => {
  const mockOpen = async () => {
    throw new Deno.errors.PermissionDenied('permission denied');
  };

  const mockStdout = new WritableStream({
    write() {},
  });

  let stderrOutput = new Uint8Array();
  const mockStderr = new WritableStream({
    write(chunk) {
      const newData = new Uint8Array(stderrOutput.length + chunk.length);
      newData.set(stderrOutput);
      newData.set(chunk, stderrOutput.length);
      stderrOutput = newData;
    },
  });

  const exitCode = await cat(
    ['restricted.txt'],
    mockOpen,
    null,
    mockStdout,
    mockStderr
  );
  assertEquals(exitCode, 1);

  const errorMsg = new TextDecoder().decode(stderrOutput);
  assertEquals(errorMsg.includes('restricted.txt'), true);
  assertEquals(errorMsg.includes('permission denied'), true);
  assertEquals(errorMsg.includes('No such file or directory'), false);
});
