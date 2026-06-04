import {
  assertEquals,
  assertRejects,
} from "https://deno.land/std@0.208.0/assert/mod.ts";
import {
  copyStreamToStdout,
  createFileStream,
  createStdinStream,
} from "../src/stream_reader.js";

Deno.test(
  "createFileStream - successfully creates stream from file",
  async () => {
    // Create a mock file object
    const mockContent = new TextEncoder().encode("Hello, World!");
    const mockReadable = new ReadableStream({
      start(controller) {
        controller.enqueue(mockContent);
        controller.close();
      },
    });

    const mockFile = { readable: mockReadable };
    const mockOpen = async () => mockFile;

    const stream = await createFileStream("test.txt", mockOpen);
    assertEquals(stream, mockReadable);
  },
);

Deno.test("createFileStream - throws error for non-existent file", async () => {
  const mockOpen = async () => {
    throw new Deno.errors.NotFound("file not found");
  };

  await assertRejects(
    async () => await createFileStream("nonexistent.txt", mockOpen),
    Deno.errors.NotFound,
  );
});
B;

Deno.test("createStdinStream - returns provided stdin stream", () => {
  const mockStdin = new ReadableStream();
  const stream = createStdinStream(mockStdin);
  assertEquals(stream, mockStdin);
});

Deno.test(
  "copyStreamToStdout - successfully copies stream to stdout",
  async () => {
    const testData = new TextEncoder().encode("test content");
    const inputStream = new ReadableStream({
      start(controller) {
        controller.enqueue(testData);
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

    await copyStreamToStdout(inputStream, mockStdout);
    assertEquals(writtenData, testData);
  },
);

Deno.test("copyStreamToStdout - handles empty stream", async () => {
  const inputStream = new ReadableStream({
    start(controller) {
      controller.close();
    },
  });

  let writeCount = 0;
  const mockStdout = new WritableStream({
    write() {
      writeCount++;
    },
  });

  await copyStreamToStdout(inputStream, mockStdout);
  assertEquals(writeCount, 0);
});
