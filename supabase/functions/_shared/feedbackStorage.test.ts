import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { feedbackObjectPath, canManageFeedback } from './feedbackStorage.ts';

const origin = 'https://project.supabase.co';
test('accepts legacy public URL, signed URL and plain path', () => {
  assert.equal(feedbackObjectPath(`${origin}/storage/v1/object/public/feedback_images/feedback_123.jpg`, origin), 'feedback_123.jpg');
  assert.equal(feedbackObjectPath(`${origin}/storage/v1/object/sign/feedback_images/user/image.jpg?token=secret`, origin), 'user/image.jpg');
  assert.equal(feedbackObjectPath('user/image.jpg', origin), 'user/image.jpg');
});
test('rejects external URLs, other buckets and path traversal', () => {
  for (const value of [null, '', '../secret.jpg', 'user/../secret.jpg', '/image.jpg', 'user//image.jpg', 'javascript:alert(1)',
    'https://evil.test/storage/v1/object/public/feedback_images/photo.jpg',
    `${origin}/storage/v1/object/public/avatars/photo.jpg`,
    `${origin}/storage/v1/object/public/feedback_images/%2e%2e%2fsecret.jpg`]) {
    assert.equal(feedbackObjectPath(value, origin), null, String(value));
  }
});
test('feedback operations require the exact permission, including for unexpected roles', () => {
  assert.equal(canManageFeedback('admin', ['feedback'], 'get_messages'), true);
  assert.equal(canManageFeedback('admin', ['feedback'], 'delete_message'), false);
  assert.equal(canManageFeedback('admin', ['feedback.delete'], 'delete_message'), true);
  assert.equal(canManageFeedback('user', ['feedback.delete'], 'delete_message'), false);
  assert.equal(canManageFeedback('super_admin', [], 'delete_message'), true);
  assert.equal(canManageFeedback('super_admin', [], 'delete_image'), false);
});
