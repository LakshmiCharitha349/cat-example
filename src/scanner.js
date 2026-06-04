export class Scanner {
  #tokens;

  constructor(tokens) {
    this.#tokens = tokens.slice();
  }

  peek() {
    return this.#tokens[0];
  }

  consume() {
    return this.#tokens.shift();
  }

  isDone() {
    return this.#tokens.length === 0;
  }

  flush() {
    return this.#tokens.slice();
  }
}
