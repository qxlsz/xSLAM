const fs = require('fs')
const gracefulFs = require('graceful-fs')
gracefulFs.gracefulify(fs)
console.log('Graceful-fs patched!')
