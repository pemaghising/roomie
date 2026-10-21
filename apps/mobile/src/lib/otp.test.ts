import { describe, expect, test } from 'vitest';
import { otpMessage, resendCooldown } from './otp';

describe('email code messages', () => {
  test('a wrong or expired code reads like frame 05b', () => {
    expect(otpMessage({ status: 403, message: 'Token has expired or is invalid' })).toBe('Hmm, wrong code.');
    expect(otpMessage({ status: 400, message: 'invalid token' })).toBe('Hmm, wrong code.');
  });

  test('rate limits tell you what to do', () => {
    expect(otpMessage({ status: 429, message: 'Email rate limit exceeded' })).toBe('Too many tries. Wait a minute, then send a new one.');
  });

  test('anything else blames the connection, not the person', () => {
    expect(otpMessage(new TypeError('Network request failed'))).toBe('Couldn’t reach Roomie. Check your connection and try again.');
  });
});

describe('resend cooldown', () => {
  test('counts down from 30 seconds after a code is sent', () => {
    expect(resendCooldown(1_000, 1_000)).toBe(30);
    expect(resendCooldown(1_000, 7_400)).toBe(24);
    expect(resendCooldown(1_000, 32_000)).toBe(0);
  });
});
