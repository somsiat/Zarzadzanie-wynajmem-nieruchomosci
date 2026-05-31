import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';

// JSDOM nie implementuje window.alert; w aplikacji jest używany w kilku miejscach.
globalThis.alert = vi.fn();

