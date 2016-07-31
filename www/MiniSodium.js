"use strict";
var exec = require('cordova/exec');

function isValidInput(i, varName, expectedLength){
	if (expectedLength){
		if (is_hex(i)){
			if (i.length != expectedLength * 2) throw new TypeError(varName + ' must be ' + expectedLength + ' bytes long');
		} else if (i instanceof Uint8Array){
			if (i.length != expectedLength) throw new TypeError(varName + ' must be ' + expectedLength + ' bytes long');
		} else throw new TypeError(varName + ' must be a string or a Uint8Array, and must ' + expectedLength + ' bytes long');
	} else {
		if (!(is_hex(i) || (i instanceof Uint8Array))) throw new TypeError(varName + ' must be either a string or a Uint8Array');
	}
}

function isValidUint(i, varName, valueValidationFunction){
	if (!(typeof i == 'number' && i >= 0 && Math.floor(i) == i)) throw new TypeError(varName + ' must be a positive integer number');
	if (typeof valueValidationFunction == 'function'){
		if (!valueValidationFunction(i)) throw new Error('The value of ' + varName + ' (' + i + ') is invalid');
	}
}

function isValidPositiveUint(i, varName){
	isValidUint(i, varName, function(v){return v > 0});
}

function resultHandlerFactory(cb){
	return function(r){
		if (is_hex(r)) r = from_hex(r);
		else if (typeof r == 'object'){
			for (var resultProperty in r){
				if (is_hex(r[resultProperty])) r[resultProperty] = from_hex(r[resultProperty]);
			}
		}

		cb(undefined, r);
	}
}

const TO_STRING_CHUNK_SIZE = 8192;

var MiniSodium = {
	//Secretbox construction (methods and constants)
	crypto_secretbox_KEYBYTES: 32,
	crypto_secretbox_NONCEBYTES: 24,
	crypto_secretbox_MACBYTES: 16,
	crypto_secretbox_easy: function(message, nonce, key, callback){
		if (typeof callback != 'function') throw new TypeError('callback must be a function');

		try {
			isValidInput(message, 'message');
			isValidInput(nonce, 'nonce', MiniSodium.crypto_secretbox_NONCEBYTES);
			isValidInput(key, 'key', MiniSodium.crypto_secretbox_KEYBYTES);
		} catch (e){
			callback(e);
			return;
		}

		message = to_hex(message);
		nonce = to_hex(nonce);
		key = to_hex(key);

		var params = [message, nonce, key];

		cordova.exec(resultHandlerFactory(callback), callback, 'MiniSodium', 'crypto_secretbox_easy', params);
	},
	crypto_secretbox_open_easy: function(ciphertext, nonce, key, callback){
		if (typeof callback != 'function') throw new TypeError('callback must be a function');

		try {
			isValidInput(ciphertext, 'ciphertext');
			isValidInput(nonce, 'nonce', MiniSodium.crypto_secretbox_NONCEBYTES);
			isValidInput(key, 'key', MiniSodium.crypto_secretbox_KEYBYTES);
		} catch (e){
			callback(e);
			return;
		}

		ciphertext = to_hex(ciphertext);
		nonce = to_hex(nonce);
		key = to_hex(key);

		var params = [ciphertext, nonce, key];

		cordova.exec(resultHandlerFactory(callback), callback, 'MiniSodium', 'crypto_secretbox_open_easy', params);
	},
	//Ed25519 methods
	crypto_sign_BYTES: 64,
	crypto_sign_PUBLICKEYBYTES: 32,
	crypto_sign_SECRETKEYBYTES: 64,
	crypto_sign_SEEDBYTES: 32,
	crypto_sign_keypair: function(callback){
		if (typeof callback != 'function') throw new TypeError('callback must be a function')

		cordova.exec(resultHandlerFactory(callback), callback, 'MiniSodium', 'crypto_sign_keypair', []);
	},
	crypto_sign_seed_keypair: function(seed, callback){
		if (typeof callback != 'function') throw new TypeError('callback must be a function');

		try {
			isValidInput(seed, 'seed', MiniSodium.crypto_sign_SEEDBYTES);
		} catch (e){
			callback(e);
			return;
		}

		seed = to_hex(seed);
		var params = [seed];

		cordova.exec(resultHandlerFactory(callback), callback, 'MiniSodium', 'crypto_sign_seed_keypair', params);
	},
	crypto_sign: function(message, secretKey, callback){
		if (typeof callback != 'function') throw new TypeError('callback must be a function');

		try {
			isValidInput(message, 'message');
			isValidInput(secretKey, 'secretKey', MiniSodium.crypto_sign_SECRETKEYBYTES);

			//if (message.length == 0) throw new Error('message cannot be empty');
		} catch (e){
			callback(e);
			return;
		}

		message = to_hex(message);
		secretKey = to_hex(secretKey);

		var params = [message, secretKey];
		cordova.exec(resultHandlerFactory(callback), callback, 'MiniSodium', 'crypto_sign', params);
	},
	crypto_sign_open: function(signedMessage, publicKey, callback){
		if (typeof callback != 'function') throw new TypeError('callback must be a function');

		try {
			isValidInput(signedMessage, 'signedMessage');
			isValidInput(publicKey, 'publicKey', MiniSodium.crypto_sign_PUBLICKEYBYTES);
		} catch (e){
			callback(e);
			return;
		}

		signedMessage = to_hex(signedMessage);
		publicKey = to_hex(publicKey);

		if (signedMessage.length < MiniSodium.crypto_sign_BYTES){
			callback(new Error('signed message must be longer than crypto_sign_BYTES'));
			return;
		}

		var params = [signedMessage, publicKey];
		cordova.exec(resultHandlerFactory(callback), callback, 'MiniSodium', 'crypto_sign_open', params);
	},
	crypto_sign_detached: function(message, secretKey, callback){
		if (typeof callback != 'function') throw new TypeError('callback must be a function');

		try {
			isValidInput(message, 'message');
			isValidInput(secretKey, 'secretKey', MiniSodium.crypto_sign_SECRETKEYBYTES);

			//if (message.length == 0) throw new Error('message cannot be empty');
		} catch (e){
			callback(e);
			return;
		}

		message = to_hex(message);
		secretKey = to_hex(secretKey);

		var params = [message, secretKey];
		cordova.exec(resultHandlerFactory(callback), callback, 'MiniSodium', 'crypto_sign_detached', params);
	},
	crypto_sign_verify_detached: function(signature, message, publicKey, callback){
		if (typeof callback != 'function') throw new TypeError('callback must be a function');

		try {
			isValidInput(signature, 'signature', MiniSodium.crypto_sign_BYTES);
			isValidInput(message, 'message');
			isValidInput(publicKey, 'publicKey', MiniSodium.crypto_sign_PUBLICKEYBYTES);
		} catch (e){
			callback(e);
			return;
		}

		signature = to_hex(signature);
		message = to_hex(message);
		publicKey = to_hex(publicKey);

		var params = [signature, message, publicKey];
		cordova.exec(resultHandlerFactory(callback), callback, 'MiniSodium', 'crypto_sign_verify_detached', params);
	},
	crypto_sign_ed25519_sk_to_seed: function(secretKey, callback){
		if (typeof callback != 'function') throw new TypeError('callback must be a function');

		try {
			isValidInput(secretKey, 'secretKey', MiniSodium.crypto_sign_SECRETKEYBYTES);
		} catch (e){
			callback(e);
			return;
		}

		secretKey = to_hex(secretKey);
		var params = [secretKey];
		cordova.exec(resultHandlerFactory(callback), callback, 'MiniSodium', 'crypto_sign_ed25519_sk_to_seed', params);
	},
	crypto_sign_ed25519_sk_to_pk: function(secretKey, callback){
		if (typeof callback != 'function') throw new TypeError('callback must be a function');

		try {
			isValidInput(secretKey, 'secretKey', MiniSodium.crypto_sign_SECRETKEYBYTES);
		} catch (e){
			callback(e);
			return;
		}

		secretKey = to_hex(secretKey);
		var params = [secretKey];
		cordova.exec(resultHandlerFactory(callback), callback, 'MiniSodium', 'crypto_sign_ed25519_sk_to_pk', params);
	},
	//Ed25519 -> Curve25519 keypair conversion
	crypto_sign_ed25519_sk_to_curve25519: function(ed25519Sk, callback){
		if (typeof callback != 'function') throw new TypeError('callback must be a function');

		try {
			isValidInput(ed25519Sk, 'ed25519Sk', MiniSodium.crypto_sign_SECRETKEYBYTES);
		} catch (e){
			callback(e);
			return;
		}

		ed25519Sk = to_hex(ed25519Sk);
		var params = [ed25519Sk];
		cordova.exec(resultHandlerFactory(callback), callback, 'MiniSodium', 'crypto_sign_ed25519_sk_to_curve25519', params);
	},
	crypto_sign_ed25519_pk_to_curve25519: function(ed25519Pk, callback){
		if (typeof callback != 'function') throw new TypeError('callback must be a function');

		try {
			isValidInput(ed25519Pk, 'ed25519Pk', MiniSodium.crypto_sign_PUBLICKEYBYTES);
		} catch (e){
			callback(e);
			return;
		}

		ed25519Pk = to_hex(ed25519Pk);
		var params = [ed25519Pk];
		cordova.exec(resultHandlerFactory(callback), callback, 'MiniSodium', 'crypto_sign_ed25519_pk_to_curve25519', params);
	},
	//Curve25519 methods
	crypto_scalarmult_BYTES: 32,
	crypto_scalarmult_SCALARBYTES: 32,
	crypto_scalarmult_base: function(n, callback){
		if (typeof callback != 'function') throw new TypeError('callback must be a function');

		try {
			isValidInput(n, 'n', MiniSodium.crypto_scalarmult_SCALARBYTES);
		} catch (e){
			callback(e);
			return;
		}

		n = to_hex(n);
		var params = [n];
		cordova.exec(resultHandlerFactory(callback), callback, 'MiniSodium', 'crypto_scalarmult_base', params);
	},
	crypto_scalarmult: function(n, p, callback){
		if (typeof callback != 'function') throw new TypeError('callback must be a function');

		try {
			isValidInput(n, 'n', MiniSodium.crypto_scalarmult_SCALARBYTES);
			isValidInput(p, 'p', MiniSodium.crypto_scalarmult_BYTES);
		} catch (e){
			callback(e);
			return;
		}

		n = to_hex(n);
		p = to_hex(p);

		var params = [n, p];
		cordova.exec(resultHandlerFactory(callback), callback, 'MiniSodium', 'crypto_scalarmult', params);
	},
	//Scrypt password hashing
	crypto_pwhash_scryptsalsa208sha256_SALTBYTES: 32,
	crypto_pwhash_scryptsalsa208sha256_OPSLIMIT_INTERACTIVE: 524288,
	crypto_pwhash_scryptsalsa208sha256_MEMLIMIT_INTERACTIVE: 16777216,
	crypto_pwhash_scryptsalsa208sha256: function(keyLength, password, salt, opsLimit, memLimit, callback){
		if (typeof callback != 'function') throw new TypeError('callback must be a function');

		try {
			isValidPositiveUint(keyLength, 'keyLength');
			isValidInput(password, 'password');
			isValidInput(salt, 'salt', MiniSodium.crypto_pwhash_scryptsalsa208sha256_SALTBYTES);
			isValidPositiveUint(opsLimit, 'opsLimit');
			isValidPositiveUint(memLimit, 'memLimit');
		} catch (e){
			callback(e);
			return;
		}

		password = to_hex(password);
		salt = to_hex(salt);

		var params = [keyLength, password, salt, opsLimit, memLimit];
		cordova.exec(resultHandlerFactory(callback), callback, 'MiniSodium', 'crypto_pwhash_scryptsalsa208sha256', params);
	},
	crypto_pwhash_scryptsalsa208sha256_ll: function(password, salt, opsLimit, r, p, keyLength, callback){
		if (typeof callback != 'function') throw new TypeError('callback must be a function');

		try {
			isValidInput(password, 'password');
			isValidInput(salt, 'salt');
			isValidPositiveUint(opsLimit, 'opsLimit');
			isValidPositiveUint(r, 'r');
			isValidPositiveUint(p, 'p');
			isValidPositiveUint(keyLength);
		} catch (e){
			callback(e);
			return;
		}

		password = to_hex(password);
		salt = to_hex(salt);

		var params = [password, salt, opsLimit, r, p, keyLength];
		cordova.exec(resultHandlerFactory(callback), callback, 'MiniSodium', 'crypto_pwhash_scryptsalsa208sha256_ll', params);
	},
	//Box and sealed box constructions
	crypto_box_PUBLICKEYBYTES: 32,
	crypto_box_SECRETKEYBYTES: 32,
	crypto_box_NONCEBYTES: 24,
	crypto_box_SEEDBYTES: 32,
	crypto_box_MACBYTES: 16,
	crypto_box_SEALBYTES: 48,
	crypto_box_keypair: function(){

	},
	crypto_box_easy: function(){

	},
	crypto_box_open_easy: function(){

	},
	crypto_box_seal: function(){

	},
	crypto_box_seal_open: function(){

	},
	//Simple generic hashing
	crypto_generichash: function(){

	},
	//Hexdecimal encoding helpers
	from_hex: function(str) {
    if (!is_hex(str)) {
      throw new TypeError("The provided string doesn't look like hex data");
    }
    var result = new Uint8Array(str.length / 2);
    for (var i = 0; i < str.length; i += 2) {
      result[i >>> 1] = parseInt(str.substr(i, 2), 16);
    }
    return result;
  },
	to_hex: function(bytes) {
		if (is_hex(bytes)) return bytes;
		if (!(bytes instanceof Uint8Array)) throw new TypeError('bytes must be a Uint8Array instance');

		var str = "", b, c, x;
		for (var i = 0; i < bytes.length; i++) {
			c = bytes[i] & 0xf;
			b = bytes[i] >>> 4;
			x = (87 + c + (((c - 10) >> 8) & ~38)) << 8 |
			(87 + b + (((b - 10) >> 8) & ~38));
			str += String.fromCharCode(x & 0xff) + String.fromCharCode(x >>> 8);
		}
		return str;
	},
	is_hex: function(s){
		return typeof s === 'string' && s.length % 2 === 0 && (s.length > 0 ? /^([a-f]|[0-9])+$/ig.test(s) : true);
	},
	from_buffer: function(bytes) { //The to_string function from libsodium.js
		if (typeof TextDecoder === "function") {
			return new TextDecoder("utf-8", {fatal: true}).decode(bytes);
		}

		var numChunks = Math.ceil(bytes.length / TO_STRING_CHUNK_SIZE);
		if (numChunks <= 1) {
			try {
				return decodeURIComponent(escape(String.fromCharCode.apply(null, bytes)));
			}
			catch (_) {
				throw new TypeError("The encoded data was not valid.");
			}
		}
		var totalString = '';
		var sequenceReadOffset = 0;
		for (var i = 0; i < numChunks; i++) {
			var currentChunk =
			Array.prototype.slice.call(bytes,
				i * TO_STRING_CHUNK_SIZE + sequenceReadOffset,
				(i + 1) * TO_STRING_CHUNK_SIZE + sequenceReadOffset);
			//Depending on how much we have shifted
			if (currentChunk.length == 0) {
				continue;
			}

			//Checking that we didn't cut the buffer in the middle of a UTF8 sequence.
			//If we did, remove the bytes of the "cut" sequence and
			//decrement sequenceReadOffset for each removed byte
			var sequenceDetectionComplete,
			sequenceIndex = currentChunk.length,
			sequenceLength = 0;

			//This loop will read the chunk from its end, looking for sequence start bytes
			do {
				sequenceIndex--;
				var currentByte = currentChunk[sequenceIndex];

				if (currentByte >= 240) { //Beginning of a 4-byte UTF-8 sequence
					sequenceLength = 4;
					sequenceDetectionComplete = true;
				} else if (currentByte >= 224) { //Beginning of a 3-byte UTF-8 sequence
					sequenceLength = 3;
					sequenceDetectionComplete = true;
				} else if (currentByte >= 192) { //Beginning of a 2-byte UTF-8 sequence
					sequenceLength = 2;
					sequenceDetectionComplete = true;
				} else if (currentByte < 128) { //A one byte UTF-8 char
					sequenceLength = 1;
					sequenceDetectionComplete = true;
				}
				//The values between [128, 192[ are part of a UTF-8 sequence.
				//The loop will not exit in that case, and will iterate one byte backwards instead
			} while (!sequenceDetectionComplete);

			var extraBytes = sequenceLength - (currentChunk.length - sequenceIndex);
			for (var j = 0; j < extraBytes; j++) {
				sequenceReadOffset--;
				currentChunk.pop();
			}

			totalString += to_string(currentChunk);
		}
		return totalString;
	},
	to_buffer: function(str) { //The from_string function from libsodium.js
		if (typeof TextEncoder === "function") {
			return new TextEncoder("utf-8").encode(str);
		}
		str = unescape(encodeURIComponent(str));
		var bytes = new Uint8Array(str.length);
		for (var i = 0; i < str.length; i++) {
			bytes[i] = str.charCodeAt(i);
		}
		return bytes;
	}
};

var from_hex = MiniSodium.from_hex;
var to_hex = MiniSodium.to_hex;
var is_hex = MiniSodium.is_hex;

module.exports = MiniSodium;
