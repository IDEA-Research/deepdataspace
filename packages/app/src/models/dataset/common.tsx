/**
 * 1、Page public member variables.
 * 2、Page default request.
 */
import { useMemo } from 'react';
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
} from '@/constants';
import { getCategoryColors } from '@/utils/color';
import { getDefaultDisplayOptions } from '@/utils/annotation';
import {
  DEFALUE_PAGE_INNER_DATA,
  DEFAULT_PAGE_DATA,
  DEFAULT_PAGE_STATE,
  DEFAULT_DATASET_INFO_STATE,
  PageData,
  PageState,
  DatasetInfo,
  AnnotationImageRender,
} from './type';
import { API } from '@/services/type';
import AnnotationImage from '@/components/AnnotationImage';

export default () => {
  const [pageState, setPageState] = useImmer<PageState>({
    ...DEFAULT_PAGE_STATE,
  });

  const [pageData, setPageData] = useImmer<PageData>({
    ...DEFAULT_PAGE_DATA,
  });

  const [datasetInfo, setDatasetInfo] = useImmer<DatasetInfo>({
    ...DEFAULT_DATASET_INFO_STATE,
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
      onSuccess: (
        { categoryList, labelList, objectTypes, name, description },
        params,
      ) => {
        setDatasetInfo((s) => {
          s.name = name;
          s.description = description;
        });

        const defaultLabelType =
          params.length > 0 ? params[0] : LABEL_SOURCE.gt;
        // if (!categoryList || !categoryList.length) {
        //   message.warning('none category');
        //   return;
        // }
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
      onSuccess: (result: API.FetchImgListRsp) => {
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
  const categoryColors = useMemo(
    () =>
      getCategoryColors(
        filters.categories.map((item) => item.id),
        filterValues.categoryId,
      ),
    [filters.categories, filterValues.categoryId],
  );
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

  const renderAnnotationImage: AnnotationImageRender = (record) => {
    const {
      data,
      currentSize,
      wrapWidth,
      wrapHeight,
      minHeight,
      isPreview,
      imgStyle,
      onLoad,
    } = record;
    const globalDisplayOptions = {
      ...displayOptionsResult,
      categoryId: pageState.filterValues.categoryId || '',
      categoryColors,
    };
    const modeDisplayOptions = {
      diffMode: {
        labels: pageData.filters.labels,
        displayLabelIds,
        isTiledDiff,
      },
      analysisMode: pageState.comparisons,
    };

    if (!data) return null;

    return (
      <AnnotationImage
        image={data}
        objects={data.objects}
        curLabelId={data.curLabelId}
        currentSize={currentSize}
        wrapWidth={wrapWidth}
        wrapHeight={wrapHeight}
        minHeight={minHeight}
        isPreview={isPreview}
        imgStyle={imgStyle}
        displayType={pageState.filterValues.displayAnnotationType}
        globalDisplayOptions={globalDisplayOptions}
        modeDisplayOptions={modeDisplayOptions}
        onLoad={onLoad}
      />
    );
  };

  return {
    // page var
    pageState,
    setPageState,
    pageData,
    setPageData,
    datasetInfo,
    setDatasetInfo,
    onInitPageState,
    onPageContentLoaded,
    onPreviewIndexChange,
    exitPreview,

    // require
    loadDatasetInfo,
    loadImgList,

    // compute var
    loading,
    categoryColors,
    displayLabelIds,
    isTiledDiff,
    displayOptionsResult,

    // common render
    renderAnnotationImage,
  };
};
