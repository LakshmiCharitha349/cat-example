import { isOption, isValidArg, needArgs, parseArgs } from "../src/parser.js";

import { assertEquals } from "https://deno.land/std@0.208.0/assert/assert_equals.ts";

Deno.test("simple test on OptneedArgs", () => {
  assertEquals(needArgs("-n"), true);
});

Deno.test("test on OptneedArgs with no need args", () => {
  assertEquals(needArgs("-q"), false);
});

Deno.test("is valid option : -q", () => {
  assertEquals(isOption("-q"), true);
});

Deno.test("is valid option : -x", () => {
  assertEquals(isOption("-x"), false);
});

Deno.test("is valid arg : 5", () => {
  assertEquals(isValidArg("5"), true);
});

Deno.test("is valid arg : w", () => {
  assertEquals(isValidArg("w"), false);
});

Deno.test("parse args : only file name", () => {
  const output = {
    isQuiteMode: false,
    options: "-n",
    count: 10,
    files: ["file1.txt"],
  };
  assertEquals(parseArgs(["file1.txt"]), output);
});
