import { Scanner } from "./scanner.js";

const optsNeedArgs = new Set(["-n", "-c"]);

export const needArgs = (opt) => optsNeedArgs.has(opt);

export const isOption = (opt) => /-[cnq]/.test(opt);

export const isValidArg = (arg) => /\d+/.test(arg);

const generateErr = (arg, errType) => {
  const errMsg = `head: illegal ${errType} count -- ${arg}`;
  throw new Error(errMsg);
};

export const parseArgs = (args) => {
  const scanner = new Scanner(args);
  const args = {
    isQuietMode: false,
    options: [],
  };

  while (!scanner.isDone() && isOption(scanner.peek())) {
    const opt = scanner.consume();

    if (needArgs(opt)) {
      const count = scanner.consume();

      if (!isValidArg(count)) {
        generateErr(count, "count");
      }

      args.options.push({ opt, count });
      continue;
    }

    args.isQuietMode = true;
  }

  if (args.options.length >= 2) {
    throw new Error("head: can't combine line and byte counts");
  }

  if (args.options.length === 0) args.options.push({ opt: "-n", count: 10 });

  args.files = scanner.flush();
  return args;
};
