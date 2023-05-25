import { keypoints1, keypoints2, skeleton } from './temp';

const item = {
  id: 0,
  flag: 0,
  height: null,
  objects: [
    {
      label_id: 'd9d0176ea19c229ec4de0e7963600c9f',
      label_name: 'GroundTruth',
      label_type: 'GT',
      category_id: '43558b63c7f8332e94a55e990b3323cf',
      category_name: 'test',
      conf: 1,
      is_group: false,
      bounding_box: {
        xmin: 70 / 500,
        ymin: 190 / 302,
        xmax: 136 / 500,
        ymax: 298 / 302,
      },
      segmentation: null,
      alpha: null,
      source: 'GT',
      points: keypoints1.flat(),
      lines: skeleton.flat(),
    },
    {
      label_id: 'd9d0176ea19c229ec4de0e7963600c9f',
      label_name: 'GroundTruth',
      label_type: 'GT',
      category_id: '43558b63c7f8332e94a55e990b3323cf',
      category_name: 'test',
      conf: 1,
      is_group: false,
      bounding_box: {
        xmin: 45 / 500,
        ymin: 80 / 302,
        xmax: 92 / 500,
        ymax: 169 / 302,
      },
      segmentation: null,
      alpha: null,
      source: 'GT',
      points: keypoints2.flat(),
      lines: skeleton.flat(),
    },
  ],
  type: 'tsv',
  url: '/static/000000002299.jpg',
  url_full_res: '/static/000000002299.jpg',
  width: null,
  desc: '{"file": "/home/chenyihao/code/test/data/5.jpg", "idx": 0}',
  metadata: {
    file: '/home/chenyihao/code/test/data/5.jpg',
    idx: 0,
  },
};

export default {
  'GET  /api/v1/images': (req: any, res: any) => {
    res.json({
      code: 0,
      msg: 'success',
      data: {
        image_list: new Array(2).fill({ ...item }).map((item, index) => {
          item.id = `${item.id}_${index}`;
          return item;
        }),
        page_size: 50,
        page_num: 1,
        total: 2,
      },
    });
  },
  'POST /api/poseEstimation': (req: any, res: any) => {
    res.json({
      code: 0,
      msg: 'success',
      data: {
        objects: [
          {
            categoryName: 'person',
            boundingBox: {
              xmin: 0.6916249999999999,
              ymin: 0.1258413926499033,
              xmax: 0.9421406250000001,
              ymax: 0.988762088974855,
            },
            points: [
              515.0, 134.0, 0.0, 1.0, 2.0, 1.0, 521.0, 103.0, 0.0, 1.0, 2.0,
              1.0, 503.0, 104.0, 0.0, 1.0, 2.0, 1.0, 539.0, 112.0, 0.0, 1.0,
              2.0, 1.0, 494.0, 112.0, 0.0, 1.0, 2.0, 1.0, 549.0, 163.0, 0.0,
              1.0, 2.0, 1.0, 477.0, 163.0, 0.0, 1.0, 2.0, 1.0, 582.0, 238.0,
              0.0, 1.0, 2.0, 1.0, 452.0, 239.0, 0.0, 1.0, 2.0, 1.0, 605.0,
              303.0, 0.0, 1.0, 2.0, 1.0, 425.0, 305.0, 0.0, 1.0, 2.0, 1.0,
              543.0, 305.0, 0.0, 1.0, 2.0, 1.0, 485.0, 300.0, 0.0, 1.0, 2.0,
              1.0, 533.0, 427.0, 0.0, 1.0, 2.0, 1.0, 478.0, 422.0, 0.0, 1.0,
              2.0, 1.0, 529.0, 509.0, 0.0, 1.0, 2.0, 1.0, 481.0, 509.0, 0.0,
              1.0, 2.0, 1.0,
            ],
            lines: [
              15, 13, 13, 11, 16, 14, 14, 12, 11, 12, 5, 11, 6, 12, 5, 6, 5, 7,
              6, 8, 7, 9, 8, 10, 1, 2, 0, 1, 0, 2, 1, 3, 2, 4, 3, 5, 4, 6,
            ],
            pointColors: [
              '128',
              '0',
              '0',
              '255',
              '178',
              '102',
              '230',
              '230',
              '0',
              '255',
              '51',
              '255',
              '153',
              '204',
              '255',
              '255',
              '128',
              '0',
              '0',
              '255',
              '255',
              '128',
              '0',
              '255',
              '51',
              '153',
              '255',
              '169',
              '165',
              '139',
              '255',
              '0',
              '0',
              '102',
              '255',
              '102',
              '184',
              '97',
              '134',
              '128',
              '128',
              '0',
              '255',
              '190',
              '255',
              '0',
              '128',
              '0',
              '0',
              '0',
              '255',
            ],
            pointNames: [
              'nose',
              'left_eye',
              'right_eye',
              'left_ear',
              'right_ear',
              'left_shoulder',
              'right_shoulder',
              'left_elbow',
              'right_elbow',
              'left_wrist',
              'right_wrist',
              'left_hip',
              'right_hip',
              'left_knee',
              'right_knee',
              'left_ankle',
              'right_ankle',
            ],
          },
        ],
      },
    });
  },
  'POST  /api/segmentation': (req: any, res: any) => {
    res.json({
      code: 0,
      msg: 'success',
      data: {
        category_name: 'person',
        polygons: [[300, 20, 100, 30, 120, 100]],
      },
    });
  },
  // 'POST /api/fetchSubsetList': (req: any, res: any) => {
  //   res.json({
  //     code: 0,
  //     msg: 'success',
  //     data: {
  //       subset_list: [
  //         {
  //           id: '1111',
  //           name: 'rail/train',
  //         },
  //         {
  //           id: '2222',
  //           name: 'clip/clip_def_only',
  //         },
  //         {
  //           id: '3333',
  //           name: 'clip/ref_images/ref_images_v0',
  //         },
  //         {
  //           id: '4444',
  //           name: 'clickture/Clickture-Lite',
  //         },
  //       ],
  //       total: 4,
  //     },
  //   });
  // },
  // 'POST /api/fetchSubsetDetail': (req: any, res: any) => {
  //   res.json({
  //     code: 0,
  //     msg: 'success',
  //     data: {
  //       category_list: [
  //         {
  //           id: 'all',
  //           name: 'All'
  //         },
  //         {
  //           id: 'person',
  //           name: 'Person',
  //         }
  //       ],
  //     },
  //   });
  // },
  // 'POST /api/fetchImgList': (req: any, res: any) => {
  //   res.json({
  //     code: 0,
  //     msg: 'success',
  //     data: {
  //       img_list: getImglist(req.body.page),
  //       total: 222,
  //     },
  //   });
  // },
};
