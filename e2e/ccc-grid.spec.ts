import path from 'path';
import { expect, Locator, Page, test } from '@playwright/test';

const SCREENSHOT_DIR = path.join(__dirname, 'screenshots');

async function screenshot(page: Page, name: string): Promise<void> {
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, `${name}.png`), fullPage: true });
}

async function setSelectionType(page: Page, type: 'none' | 'single' | 'multiple'): Promise<void> {
  await page.getByTestId('selection-type-select').click();
  await page.getByRole('option', { name: type, exact: true }).click();
}

async function setPageSize(page: Page, label: 'No paging' | '5' | '10'): Promise<void> {
  await page.getByTestId('page-size-select').click();
  await page.getByRole('option', { name: label, exact: true }).click();
}

function rows(page: Page): Locator {
  return page.locator('tr.k-master-row');
}

test.describe('ccc-grid', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/grid-showcase');
    await page.waitForSelector('kendo-grid');
  });

  test('renders all rows and columns with default inputs', async ({ page }) => {
    await expect(rows(page)).toHaveCount(12);
    const headerText = await page.locator('.k-grid-header').innerText();
    expect(headerText).toContain('ID');
    expect(headerText).toContain('Name');
    expect(headerText).toContain('Email');
    // selectionType defaults to 'none' -> no checkboxes rendered
    await expect(page.locator('input.k-checkbox')).toHaveCount(0);
    // pageSize defaults to undefined -> no pager rendered
    await expect(page.locator('.k-pager')).toHaveCount(0);

    await screenshot(page, '01-default');
  });

  test('selectionType none / single / multiple change how rows can be selected', async ({ page }) => {
    // none: no checkboxes anywhere
    await expect(page.locator('input.k-checkbox')).toHaveCount(0);
    await screenshot(page, '02-selection-none');

    // single: a checkbox per row, no select-all in the header, only one row selectable at a time
    await setSelectionType(page, 'single');
    await expect(page.locator('.k-grid-header input.k-checkbox')).toHaveCount(0);
    await expect(rows(page).locator('input.k-checkbox')).toHaveCount(12);
    await screenshot(page, '03-selection-single');

    await rows(page).nth(0).locator('input.k-checkbox').click();
    await expect(page.getByTestId('selected-summary')).toHaveText('Selected: 1 (1)');
    await rows(page).nth(1).locator('input.k-checkbox').click();
    await expect(page.getByTestId('selected-summary')).toHaveText('Selected: 1 (2)');
    await screenshot(page, '04-selection-single-selected');

    // multiple: select-all checkbox appears in the header, multiple rows stay selected
    await setSelectionType(page, 'multiple');
    await expect(page.locator('.k-grid-header input.k-checkbox')).toHaveCount(1);
    await screenshot(page, '05-selection-multiple');

    // the row selected while in "single" mode above carries over into "multiple" mode;
    // clear it via select-all/deselect-all so the selection below starts from empty
    await page.locator('.k-grid-header input.k-checkbox').click();
    await expect(page.getByTestId('selected-summary')).toContainText('Selected: 12');
    await page.locator('.k-grid-header input.k-checkbox').click();
    await expect(page.getByTestId('selected-summary')).toHaveText('Selected: 0');

    await rows(page).nth(0).locator('input.k-checkbox').click();
    await rows(page).nth(1).locator('input.k-checkbox').click();
    await rows(page).nth(2).locator('input.k-checkbox').click();
    await expect(page.getByTestId('selected-summary')).toHaveText('Selected: 3 (1, 2, 3)');
    await screenshot(page, '06-selection-multiple-selected');

    await page.locator('.k-grid-header input.k-checkbox').click();
    await expect(page.getByTestId('selected-summary')).toHaveText('Selected: 12 (1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12)');
    await screenshot(page, '07-selection-multiple-select-all');
  });

  test('pageSize paginates rowData when set and shows all rows when unset', async ({ page }) => {
    await expect(rows(page)).toHaveCount(12);
    await expect(page.locator('.k-pager')).toHaveCount(0);

    await setPageSize(page, '5');
    await expect(page.locator('.k-pager')).toHaveCount(1);
    await expect(rows(page)).toHaveCount(5);
    await expect(rows(page).first()).toContainText('Ada Lovelace');
    await screenshot(page, '08-pagesize-5-page1');

    await page.getByRole('button', { name: 'Go to the next page' }).click();
    await expect(rows(page)).toHaveCount(5);
    await expect(rows(page).first()).toContainText('Radia Perlman');
    await screenshot(page, '09-pagesize-5-page2');

    // return to the first page before switching pageSize, since the grid keeps its
    // current skip offset across a pageSize change
    await page.getByRole('button', { name: 'Go to the first page' }).click();
    await setPageSize(page, '10');
    await expect(rows(page)).toHaveCount(10);
    await screenshot(page, '10-pagesize-10');

    await setPageSize(page, 'No paging');
    await expect(page.locator('.k-pager')).toHaveCount(0);
    await expect(rows(page)).toHaveCount(12);
  });

  test('loading shows the grid loading indicator', async ({ page }) => {
    await expect(page.locator('.k-loading-mask')).toHaveCount(0);

    await page.getByTestId('loading-toggle').locator('button').click();
    await expect(page.locator('.k-loading-mask')).toBeVisible();
    await screenshot(page, '11-loading');

    await page.getByTestId('loading-toggle').locator('button').click();
    await expect(page.locator('.k-loading-mask')).toHaveCount(0);
  });

  test('enableRowExpansion renders the detailTemplate content for an expanded row', async ({ page }) => {
    await expect(page.locator('td.k-hierarchy-cell')).toHaveCount(0);

    await page.getByTestId('row-expansion-toggle').locator('button').click();
    await expect(page.locator('td.k-hierarchy-cell')).toHaveCount(12);
    await screenshot(page, '12-row-expansion-enabled');

    await rows(page).nth(0).locator('td.k-hierarchy-cell a').click();
    await expect(page.getByTestId('row-detail').first()).toBeVisible();
    await expect(page.getByTestId('row-detail').first()).toHaveText('Extra info for Ada Lovelace (id: 1)');
    await screenshot(page, '13-row-expansion-expanded');
  });

  test('columnDefs buttonConfig renders link and function action columns', async ({ page }) => {
    const firstRow = rows(page).first();

    const viewLink = firstRow.locator('a[mat-icon-button]');
    await expect(viewLink).toHaveAttribute('href', '/view/1');

    await firstRow.locator('ccc-table-button button').click();
    await expect(page.getByTestId('action-log')).toHaveText('Last action: Notify clicked for id 1');
    await screenshot(page, '14-button-columns');
  });

  test('columnDefs hideHeader hides the column label but keeps the column data', async ({ page }) => {
    const headerCells = page.locator('.k-grid-header th');
    // The "Role" column is configured with hideHeader: true.
    const roleHeaderText = await headerCells.allInnerTexts();
    expect(roleHeaderText.join('')).not.toContain('Role');
    await expect(rows(page).first()).toContainText('Engineer');
  });
});
