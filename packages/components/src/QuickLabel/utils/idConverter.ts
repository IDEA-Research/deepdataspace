export const idConverter = (prefix: string, items: { id?: string }[]) => {
  const getStringItemId = (intId: number): string => {
    return `${prefix}${intId}`;
  };

  const isImportItem = (id: string) => id.startsWith(prefix);

  const getOriginalId = (stringId: string): number => {
    const intPart = stringId.substring(prefix.length);
    const intId = parseInt(intPart);
    if (!isNaN(intId)) {
      return intId;
    }
    return -1;
  };

  const getMaxIdOfImportItems = (items: { id?: string }[]): number => {
    const ids: number[] = items
      .filter((item) => !!item.id && isImportItem(item.id))
      .map((item) => getOriginalId(item.id!));
    if (ids.length > 0) {
      return Math.max(...ids);
    }
    return -1;
  };

  let nextAvailableId = getMaxIdOfImportItems(items) + 1;

  const getIntItemId = (id?: string) => {
    if (!!id && isImportItem(id)) {
      return getOriginalId(id);
    } else {
      return nextAvailableId++;
    }
  };

  return {
    getStringItemId,
    getIntItemId,
  };
};
