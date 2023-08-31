/**
 * 1、Page public member variables.
 * 2、Page default request.
 */
import { useCallback, useMemo } from 'react';
import { useImmer } from 'use-immer';
import { useRequest } from 'ahooks';
import {
  fetchDatasetDetail,
  fetchImgList,
  fetchComparisonsImgList,
} from '@/services/dataset';
import {
  AnnotationType,
  COMPARE_RESULT,
  DisplayOption,
  LabelDiffMode,
  LABEL_SOURCE,
  COMPARE_RESULT_FILL_COLORS,
} from '@/constants';
import {
  getDefaultDisplayOptions,
  getLabelCustomStyles,
} from '@/utils/datasets';
import {
  DEFALUE_PAGE_INNER_DATA,
  DEFAULT_PAGE_DATA,
  DEFAULT_PAGE_STATE,
  PageData,
  PageState,
} from './type';
import { isNumber } from 'lodash';
import { IAnnotationObject } from 'dds-components/Annotator';
import { NsDataSet } from '@/types/dataset';

export default () => {
  const [pageState, setPageState] = useImmer<PageState>({
    ...DEFAULT_PAGE_STATE,
  });

  const [pageData, setPageData] = useImmer<PageData>({
    ...DEFAULT_PAGE_DATA,
  });

  const { filterValues, comparisons } = pageState;
  const { filters } = pageData;

  /**
   * Initialize page parameters from the URL.
   * @param urlPageState
   */
  const onInitPageState = (urlPageState: PageState) => {
    setPageState((s) => {
      Object.assign(s, DEFAULT_PAGE_STATE, urlPageState);
    });
  };

  const onPageContentLoaded = () => {};

  const { loading: loadingDatasetInfo, runAsync: loadDatasetInfo } = useRequest(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    (_defaultLabelType?: LABEL_SOURCE) => {
      if (!pageState.datasetId) {
        throw null;
      }
      return fetchDatasetDetail({ datasetId: pageState.datasetId });
    },
    {
      refreshDeps: [pageState.datasetId],
      onSuccess: ({ categoryList, labelList, objectTypes }, params) => {
        const defaultLabelType =
          params.length > 0 ? params[0] : LABEL_SOURCE.gt;
        const types = objectTypes.filter(
          (item) => item !== AnnotationType.Classification,
        );
        const urlDisplayAnnotationType =
          pageState.filterValues.displayAnnotationType &&
          types.find(
            (item) => item === pageState.filterValues.displayAnnotationType,
          );
        setPageData((s) => {
          const displayAnnotationType = urlDisplayAnnotationType || types[0];
          const [options, optionsValue] = getDefaultDisplayOptions(
            pageState.filterValues.displayOptions,
            displayAnnotationType as AnnotationType,
          );
          s.filters.categories = [{ id: 'All', name: 'All' }, ...categoryList];
          s.filters.annotationTypes = types;
          s.filters.displayOptions = options;

          // Auto load && there are no URL parameters => add default value
          if (!urlDisplayAnnotationType) {
            setPageState((p) => {
              p.filterValues.displayOptions = optionsValue;
              p.filterValues.displayAnnotationType =
                displayAnnotationType as AnnotationType;
            });
          }
          // Add default options when there are no URL parameters.
          if (!pageState.filterValues.categoryId) {
            setPageState((p) => {
              p.filterValues.categoryId = 'All';
            });
          }
          // label
          if (labelList && labelList.length) {
            s.filters.labels = labelList.map((item) => {
              item.confidenceRange =
                item.source === LABEL_SOURCE.pred ? [0.2, 1] : [0, 1];
              if (
                item.source === defaultLabelType &&
                !urlDisplayAnnotationType
              ) {
                // Add default options when there are no URL parameters.
                setPageState((p) => {
                  p.filterValues.selectedLabelIds = [item.id];
                });
              }
              return item;
            });
          }
        });
      },
      onError: () => {},
    },
    [
      (fetchInstance) => ({
        // Not show loading
        onBefore: () => ({
          loading: !Boolean(fetchInstance.state.params?.length),
        }),
      }),
    ],
  );

  const { loading: loadingImgList, run: loadImgList } = useRequest(
    (isSlient = false) => {
      // when to load slient
      if (!pageState.datasetId || !pageState.filterValues.categoryId) {
        throw null;
      }
      if (!isSlient) {
        // reset page data
        setPageData((s) => {
          Object.assign(s, DEFALUE_PAGE_INNER_DATA);
        });
        window.scrollTo(0, 0);
      }

      const categoryId =
        pageState.filterValues.categoryId === 'All'
          ? undefined
          : pageState.filterValues.categoryId;
      const params = {
        datasetId: pageState.datasetId,
        categoryId,
        pageNum: pageState.page,
        pageSize: pageState.pageSize,
      };
      if (pageState.comparisons) {
        return fetchComparisonsImgList({
          ...params,
          labelId: pageState.comparisons.label.id,
          precision: pageState.comparisons.precision,
          orderBy: pageState.comparisons.orderBy,
          displayCategoryId: categoryId,
        });
      }
      if (pageState.flagTools && pageState.flagTools.flagStatus >= 0) {
        Object.assign(params, {
          flag: pageState.flagTools.flagStatus,
        });
      }
      return fetchImgList(params);
    },
    {
      debounceWait: 20,
      refreshDeps: [
        pageState.datasetId,
        pageState.filterValues.categoryId,
        pageState.page,
        pageState.pageSize,
        pageState.comparisons?.precision,
        pageState.comparisons?.orderBy,
        pageState.flagTools?.flagStatus,
      ],
      onSuccess: (result) => {
        setPageData((s) => {
          s.imgList = result.imageList;
          s.total = result.total;
        });
      },
      onError: () => {},
    },
    [
      (fetchInstance) => ({
        // Not show loading
        onBefore: () => ({
          loading: !Boolean(fetchInstance.state.params?.length),
        }),
      }),
    ],
  );

  const onPreviewIndexChange = (index: number) => {
    setPageState((s) => {
      s.previewIndex = index;
    });
  };

  const exitPreview = () => {
    setPageState((s) => {
      s.previewIndex = -1;
    });
  };

  // UI display-related variables.
  const loading = loadingDatasetInfo || loadingImgList;

  const displayLabelIds: string[] = useMemo(() => {
    if (comparisons) {
      const result = [];
      const gtItem = filters.labels.find(
        (item) => item.source === LABEL_SOURCE.gt,
      );
      if (
        (comparisons.displays.includes(LABEL_SOURCE.gt) ||
          comparisons.displays.includes(COMPARE_RESULT.fn)) &&
        gtItem
      ) {
        result.push(gtItem.id);
      }
      if (
        comparisons.displays.includes(LABEL_SOURCE.pred) ||
        comparisons.displays.includes(COMPARE_RESULT.fp)
      ) {
        result.push(comparisons.label.id);
      }
      return result;
    }
    return filterValues.selectedLabelIds;
  }, [comparisons, filterValues.selectedLabelIds, filters.labels]);

  /** Whether it is a real tiling comparison state. */
  const isTiledDiff = useMemo(
    () =>
      displayLabelIds.length > 1 &&
      (filterValues.displayAnnotationType === AnnotationType.Matting ||
        (comparisons
          ? comparisons.diffMode === LabelDiffMode.Tiled
          : filterValues.diffMode === LabelDiffMode.Tiled)),
    [comparisons, filterValues.diffMode, displayLabelIds],
  );

  // compute display options result
  const displayOptionsResult = useMemo(() => {
    const result: { [key in DisplayOption]?: boolean } = {};
    (Object.keys(DisplayOption) as Array<keyof typeof DisplayOption>).forEach(
      (key) => {
        result[key] = Boolean(
          filterValues.displayOptions?.find((item) => item === key),
        );
      },
    );
    return result;
  }, [pageState.filterValues.displayOptions]);

  const displayObjectsFilter = useCallback(
    (imageData: NsDataSet.DataSetImg) => {
      let objects = imageData.objects || [];

      const analysisMode = pageState.comparisons;
      const diffMode = {
        labels: pageData.filters.labels,
        displayLabelIds,
        isTiledDiff,
      };
      // Analysis mode -> filter fn/fp to display
      if (analysisMode) {
        // filter score
        objects = objects.filter(
          (item) => (item.conf || 0) >= analysisMode.score,
        );
        const predBoxsCount = objects.filter(
          (item) => item.source !== LABEL_SOURCE.gt,
        ).length;
        // compute gt compare result
        objects = objects.map((box) => {
          const newBox = { ...box };
          if (box.source === LABEL_SOURCE.gt) {
            const result =
              isNumber(box.matchedDetIdx) &&
              box.matchedDetIdx >= 0 &&
              predBoxsCount > box.matchedDetIdx
                ? COMPARE_RESULT.ok
                : COMPARE_RESULT.fn;
            newBox.compareResult = result;
          }
          return newBox;
        });
        // filters to display
        objects = objects.filter((item) => {
          if (item.compareResult === COMPARE_RESULT.ok) {
            // ok && source in displays
            return item.source && analysisMode.displays.includes(item.source);
          }
          return (
            item.compareResult &&
            analysisMode.displays.includes(item.compareResult)
          );
        });
      }

      return objects.filter((item) => {
        const { showAnnotations, showAllCategory } = displayOptionsResult;
        const categoryId = pageState.filterValues.categoryId || '';
        if (
          !showAnnotations ||
          (!showAllCategory && item.categoryId !== categoryId) ||
          (diffMode &&
            item.labelId &&
            !diffMode.displayLabelIds.includes(item.labelId)) ||
          (diffMode &&
            diffMode.isTiledDiff &&
            item.labelId !== imageData.curLabelId)
        ) {
          return false;
        }
        if (!analysisMode && diffMode) {
          const label = diffMode.labels.find(
            (label) => label.id === item.labelId,
          );
          if (!label) return false;
          if (label.source === LABEL_SOURCE.gt) return true;
          return (
            item.conf !== undefined &&
            item.conf >= label?.confidenceRange[0] &&
            item.conf <= label?.confidenceRange[1]
          );
        }
        return true;
      });
    },
    [
      pageState.comparisons,
      pageData.filters.labels,
      displayLabelIds,
      isTiledDiff,
      displayOptionsResult,
    ],
  );

  const getCustomObjectStyles = useCallback(
    (object: IAnnotationObject) => {
      const {
        colorAplha: pointAplha,
        strokeDash,
        lineWidth: thickness,
      } = getLabelCustomStyles(
        object.labelId,
        displayLabelIds,
        isTiledDiff || Boolean(pageState.comparisons),
      );
      if (Boolean(pageState.comparisons) && object.compareResult) {
        return {
          pointAplha,
          strokeDash,
          thickness,
          fillColor:
            COMPARE_RESULT_FILL_COLORS[object.compareResult] || 'transparent',
        };
      }
      return {
        pointAplha,
        strokeDash,
        thickness,
      };
    },
    [displayLabelIds, isTiledDiff, Boolean(pageState.comparisons)],
  );

  return {
    // page var
    pageState,
    setPageState,
    pageData,
    setPageData,
    onInitPageState,
    onPageContentLoaded,
    onPreviewIndexChange,
    exitPreview,

    // require
    loadDatasetInfo,
    loadImgList,

    // compute var
    loading,
    displayLabelIds,
    isTiledDiff,
    displayOptionsResult,

    // common render
    displayObjectsFilter,
    getCustomObjectStyles,
  };
};
