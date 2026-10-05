import { test, expect } from '@playwright/test';

test.describe('Login', () => {
  test('debería mostrar la página de login', async ({ page }) => {
    await page.goto('/login');
    await expect(page).toHaveTitle(/consultorio|odonto/i);
  });

  test('debería hacer login exitoso con credenciales válidas', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="text"], input[name="usuario"]', 'admin');
    await page.fill('input[type="password"]', 'C0nsult0r10_2026!');
    await page.click('button[type="submit"]');
    // Después del login debería redirigir al dashboard
    await page.waitForURL('**/');
    await expect(page.locator('body')).toContainText(/dashboard|inicio|pacientes/i);
  });

  test('debería mostrar error con credenciales inválidas', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="text"], input[name="usuario"]', 'admin');
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');
    // Debería seguir en la página de login (no redirigir al dashboard)
    await page.waitForURL('**/login');
    await expect(page.locator('body')).toContainText(/Entrar al Sistema/i);
  });
});

test.describe('Pacientes', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="text"], input[name="usuario"]', 'admin');
    await page.fill('input[type="password"]', 'C0nsult0r10_2026!');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/');
  });

  test('debería navegar a la página de pacientes', async ({ page }) => {
    await page.click('text=Pacientes');
    await page.waitForURL('**/pacientes');
    await expect(page.locator('body')).toContainText(/pacientes|lista|gestión/i);
  });
});
