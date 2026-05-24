import { parseDelegateResult } from './text.tools';

describe('text tools', () => {
  it('normalizes completed specialist output to success', () => {
    expect(
      parseDelegateResult(
        JSON.stringify({
          status: 'completed',
          createdItemIds: ['text-1'],
          updatedItemIds: [],
          deletedItemIds: [],
          selectedItemIds: ['text-1'],
          summary: 'Added the label.',
          unresolvedIssue: null,
        }),
      ),
    ).toEqual({
      status: 'success',
      createdItemIds: ['text-1'],
      updatedItemIds: [],
      deletedItemIds: [],
      selectedItemIds: ['text-1'],
      summary: 'Added the label.',
      unresolvedIssue: undefined,
    });
  });
});
