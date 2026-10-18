import { describe, expect, it } from 'vitest';
import { createEmojiIcon } from './mapHelpers';

describe('admin map icon content', () => {
    it.each(['<img src=x onerror=alert(1)>', '<svg onload=alert(1)>', '<script>alert(1)</script>'])('renders configuration as text: %s', (icon) => {
        const element = createEmojiIcon('schools', 'manual', { schools: { icon } }).createIcon();
        expect(element.textContent).toBe(icon);
        expect(element.querySelector('img,svg,script')).toBeNull();
    });

    it('keeps bundled FontAwesome icons and marker styling', () => {
        const element = createEmojiIcon('schools', 'manual', { schools: { icon: 'FaSchool' } }, 32).createIcon();
        expect(element.querySelector('svg')).not.toBeNull();
        expect((element.firstElementChild as HTMLElement).style.borderStyle).toBe('solid');
        expect(element.style.width).toBe('32px');
    });

    it('keeps emoji and unknown icon names as text', () => {
        for (const icon of ['🏫', 'FaNotAnIcon', 'constructor']) {
            const element = createEmojiIcon('schools', undefined, undefined, 28, { schools: { icon } }).createIcon();
            expect(element.textContent).toBe(icon);
        }
    });
});
