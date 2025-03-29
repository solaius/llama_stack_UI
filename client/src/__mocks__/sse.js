// Mock SSE class
class SSE {
  constructor(url, options) {
    this.url = url;
    this.options = options;
    this.onmessage = null;
    this.onerror = null;
  }

  stream() {
    return this;
  }

  close() {
    // Do nothing
  }
}

module.exports = { SSE };