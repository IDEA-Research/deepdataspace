import { useEffect } from 'react';
import useUrlState from '@ahooksjs/use-url-state';

/**
 * Page lifecycle hooks
 * - Route-related operations need to be implemented through the page
 * - Direct invocation of related hooks is not supported within the model.
 */
export default function usePageModelLifeCycle<T extends object>(object: {
  /** Bind with the page query, and update the URL parameters correspondingly when modified. */
  pageState?: T;
  /** Initialize page data based on URL when entering the page. */
  onInitPageState?: (urlPageState: T, query: Record<string, string>) => void;
  /** Entering page */
  onPageDidMount?: (query: Record<string, string>) => void;
  /** Leaving page */
  onPageWillUnmount?: () => void;
}) {
  const { pageState, onInitPageState, onPageDidMount, onPageWillUnmount } =
    object;

  // Real url query.
  // @ts-ignore
  const [query, updateQuery] = useUrlState<Record<string, string>>(
    {},
    { navigateMode: 'replace' },
  );

  useEffect(() => {
    // Trigger initialization of page state.
    if (onInitPageState) {
      let urlPageState = {};
      try {
        urlPageState = query.pageState ? JSON.parse(query.pageState) : {};
      } catch (error) {
        console.error('get urlPageState error: ', error);
      }
      onInitPageState(urlPageState as T, query);
    }
    // Trigger entering page lifecycle.
    if (onPageDidMount) {
      onPageDidMount(query);
    }
    return () => {
      // Trigger leaving page lifecycle.
      if (onPageWillUnmount) onPageWillUnmount();
    };
  }, []);

  // Bind pageState to update URL in real time.
  useEffect(() => {
    updateQuery({
      ...query,
      pageState: JSON.stringify(pageState),
    });
  }, [pageState]);

  return;
}
