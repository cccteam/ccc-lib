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
  return page.locator('tr.ccc-row');
}

function rowCheckboxes(page: Page): Locator {
  return rows(page).locator('.row-checkbox input[type="checkbox"]');
}

function headerCheckbox(page: Page): Locator {
  return page.locator('.ccc-grid-header-row .select-all-checkbox input[type="checkbox"]');
}

test.describe('ccc-grid', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/grid-showcase');
    await page.waitForSelector('.ccc-grid-host');
  });

  test('renders all rows and columns with default inputs', async ({ page }) => {
    await expect(rows(page)).toHaveCount(12);
    const headerText = await page.locator('.ccc-grid-header-row').innerText();
    expect(headerText).toContain('ID');
    expect(headerText).toContain('Name');
    expect(headerText).toContain('Email');
    // selectionType defaults to 'none' -> no checkboxes rendered
    await expect(page.locator('.ccc-grid-host input[type="checkbox"]')).toHaveCount(0);
    // pageSize defaults to undefined -> no pager rendered
    await expect(page.locator('.ccc-grid-paginator')).toHaveCount(0);

    await screenshot(page, '01-default');
  });

  test('selectionType none / single / multiple change how rows can be selected', async ({ page }) => {
    // none: no checkboxes anywhere
    await expect(page.locator('.ccc-grid-host input[type="checkbox"]')).toHaveCount(0);
    await screenshot(page, '02-selection-none');

    // single: a checkbox per row, no select-all in the header, only one row selectable at a time
    await setSelectionType(page, 'single');
    await expect(headerCheckbox(page)).toHaveCount(0);
    await expect(rowCheckboxes(page)).toHaveCount(12);
    await screenshot(page, '03-selection-single');

    await rowCheckboxes(page).nth(0).click();
    await expect(page.getByTestId('selected-summary')).toHaveText('Selected: 1 (1)');
    await rowCheckboxes(page).nth(1).click();
    await expect(page.getByTestId('selected-summary')).toHaveText('Selected: 1 (2)');
    await screenshot(page, '04-selection-single-selected');

    // multiple: select-all checkbox appears in the header, multiple rows stay selected
    await setSelectionType(page, 'multiple');
    await expect(headerCheckbox(page)).toHaveCount(1);
    await screenshot(page, '05-selection-multiple');

    // the row selected while in "single" mode above carries over into "multiple" mode;
    // clear it via select-all/deselect-all so the selection below starts from empty
    await headerCheckbox(page).click();
    await expect(page.getByTestId('selected-summary')).toContainText('Selected: 12');
    await headerCheckbox(page).click();
    await expect(page.getByTestId('selected-summary')).toHaveText('Selected: 0');

    await rowCheckboxes(page).nth(0).click();
    await rowCheckboxes(page).nth(1).click();
    await rowCheckboxes(page).nth(2).click();
    await expect(page.getByTestId('selected-summary')).toHaveText('Selected: 3 (1, 2, 3)');
    await screenshot(page, '06-selection-multiple-selected');

    await headerCheckbox(page).click();
    await expect(page.getByTestId('selected-summary')).toHaveText('Selected: 12 (1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12)');
    await screenshot(page, '07-selection-multiple-select-all');
  });

  test('pageSize paginates rowData when set and shows all rows when unset', async ({ page }) => {
    await expect(rows(page)).toHaveCount(12);
    await expect(page.locator('.ccc-grid-paginator')).toHaveCount(0);

    await setPageSize(page, '5');
    await expect(page.locator('.ccc-grid-paginator')).toHaveCount(1);
    await expect(rows(page)).toHaveCount(5);
    await expect(rows(page).first()).toContainText('Ada Lovelace');
    await screenshot(page, '08-pagesize-5-page1');

    await page.getByRole('button', { name: 'Next page' }).click();
    await expect(rows(page)).toHaveCount(5);
    await expect(rows(page).first()).toContainText('Radia Perlman');
    await screenshot(page, '09-pagesize-5-page2');

    // typing a page number jumps straight to that page
    const pageInput = page.locator('.page-jump-input');
    await pageInput.fill('3');
    await pageInput.press('Enter');
    await expect(rows(page)).toHaveCount(2);
    await expect(rows(page).first()).toContainText('Guido van Rossum');

    // an out-of-range page number clamps to the last valid page instead of erroring
    await pageInput.fill('99');
    await pageInput.press('Enter');
    await expect(rows(page)).toHaveCount(2);
    await expect(pageInput).toHaveValue('3');

    // return to the first page before switching pageSize, since the grid keeps its
    // current page index across a pageSize change
    await page.getByRole('button', { name: 'First page' }).click();
    await setPageSize(page, '10');
    await expect(rows(page)).toHaveCount(10);
    await screenshot(page, '10-pagesize-10');

    await setPageSize(page, 'No paging');
    await expect(page.locator('.ccc-grid-paginator')).toHaveCount(0);
    await expect(rows(page)).toHaveCount(12);
  });

  test('loading shows the grid loading indicator', async ({ page }) => {
    await expect(page.locator('.ccc-grid-loading-overlay')).toHaveCount(0);

    await page.getByTestId('loading-toggle').locator('button').click();
    await expect(page.locator('.ccc-grid-loading-overlay')).toBeVisible();
    // let the indeterminate spinner animate a few frames so the screenshot shows a
    // representative arc instead of catching it at its zero-length starting frame
    await page.waitForTimeout(300);
    await screenshot(page, '11-loading');

    await page.getByTestId('loading-toggle').locator('button').click();
    await expect(page.locator('.ccc-grid-loading-overlay')).toHaveCount(0);
  });

  test('enableRowExpansion renders the detailTemplate content for an expanded row', async ({ page }) => {
    await expect(page.locator('td.expand-toggle-cell')).toHaveCount(0);

    await page.getByTestId('row-expansion-toggle').locator('button').click();
    await expect(page.locator('td.expand-toggle-cell')).toHaveCount(12);
    await screenshot(page, '12-row-expansion-enabled');

    await rows(page).nth(0).locator('.expand-toggle').click();
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
    const headerCells = page.locator('.ccc-grid-header-row th');
    // The "Role" column is configured with hideHeader: true.
    const roleHeaderText = await headerCells.allInnerTexts();
    expect(roleHeaderText.join('')).not.toContain('Role');
    await expect(rows(page).first()).toContainText('Engineer');
  });
});
