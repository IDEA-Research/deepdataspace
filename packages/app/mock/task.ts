export default {
  'GET  /api/v1/label_task_roles/task_id': (req: any, res: any) => {
    res.json({
      code: 0,
      msg: 'success',
      data: {
        roleList: [
          {
            id: '285f2348bdea4d6b96e3f8750d8017da',
            project_id: 'aef84c98f343439d9fea9347c20f3434',
            task_id: 'd24afe19b373485ca37f832a59bbdd7d',
            user_id: '8eee9e3d76e7219f81dad0aa08af55a8',
            user_name: 'zhuyuanhao',
            role: 'label_leader',
            is_active: true,
            label_num_waiting: 10,
            review_num_waiting: 0,
            review_num_rejected: 0,
            review_num_accepted: 0,
            label_completed: false,
            review_completed: false,
            label_action_num: 0,
            review_action_num: 0,
            label_image_num: 0,
            review_image_num: 0,
          },
          {
            id: '0fd2d63a5186481ca355534c5869dbcc',
            project_id: 'aef84c98f343439d9fea9347c20f3434',
            task_id: 'f26b210bf3334926a949424d2b99dcb4',
            user_id: '8eee9e3d76e7219f81dad0aa08af55a8',
            user_name: 'zhuyuanhao',
            role: 'labeler',
            is_active: true,
            label_num_waiting: 10,
            review_num_waiting: 0,
            review_num_rejected: 0,
            review_num_accepted: 0,
            label_completed: false,
            review_completed: false,
            label_action_num: 0,
            review_action_num: 0,
            label_image_num: 0,
            review_image_num: 0,
          },
          {
            id: 'f398bb8b4e7e4830b8d0fce160faec44',
            project_id: 'aef84c98f343439d9fea9347c20f3434',
            task_id: 'f26b210bf3334926a949424d2b99dcb4',
            user_id: '8eee9e3d76e7219f81dad0aa08af55a8',
            user_name: 'zhuyuanhao',
            role: 'reviewer',
            is_active: true,
            label_num_waiting: 0,
            review_num_waiting: 0,
            review_num_rejected: 0,
            review_num_accepted: 0,
            label_completed: false,
            review_completed: false,
            label_action_num: 0,
            review_action_num: 0,
            label_image_num: 0,
            review_image_num: 0,
          },
        ],
      },
    });
  },
  'GET /api/v1/label_task_configs/task_id': (req: any, res: any) => {
    // const id = req.query.project_id;
    res.json({
      code: 0,
      msg: 'success',
      data: {
        categoryList: [
          {
            name: 'bowl',
            id: '280bfea841e3e3e9c19228d9c99add19',
          },
          {
            name: 'broccoli',
            id: '5f248906d8b8690753ef97e036af5bf2',
          },
          {
            name: 'orange',
            id: '00a999b76209b8442a677a5a39aa71f1',
          },
          {
            name: 'giraffe',
            id: '2b6c3178a325129f836211cf34cc2b50',
          },
          {
            name: 'potted plant',
            id: '74c68406bb0dbef37c8e49000ecfe8fa',
          },
          {
            name: 'vase',
            id: 'a98bba0e92bbfe0aed7d27d0062ead40',
          },
          {
            name: 'zebra',
            id: '78c92a3c726ff2d9fb43d6817905afc2',
          },
          {
            name: 'umbrella',
            id: '314e51c32de001cb526e979925b043c3',
          },
          {
            name: 'person',
            id: '43d9f8a307984ef1ca01be6db9bca6e8',
          },
          {
            name: 'dog',
            id: 'fbf09dd468a6e482844c5d72671fef4b',
          },
          {
            name: 'horse',
            id: '1dd4f7fa87feb3170c5cce36fb6fd187',
          },
          {
            name: 'elephant',
            id: '343483120b18d917dbfa9e7770589c51',
          },
          {
            name: 'car',
            id: '50d8c39b4a01d1d218ba462b3d0397fb',
          },
          {
            name: 'truck',
            id: '793e8ebf594a5c737e403d953c9ad27f',
          },
          {
            name: 'stop sign',
            id: '4cbb4155a247753a3a6c0c18066faefd',
          },
          {
            name: 'clock',
            id: 'd7c1f144186c2842ff2d743570a3d01d',
          },
          {
            name: 'train',
            id: '879d74f9d5ce5180b9a7daaf2f88d392',
          },
          {
            name: 'motorcycle',
            id: '0b8a60499e7fe6d5d9ca90d7def8c86d',
          },
          {
            name: 'bicycle',
            id: 'e6cbd55231e7639c3a1a1f8bbf994e3e',
          },
          {
            name: 'skateboard',
            id: 'e7256e663276b84bd12da2b539027631',
          },
          {
            name: 'airplane',
            id: '35b8f0ec070d0ae53c45b450ed0d5b5e',
          },
          {
            name: 'handbag',
            id: '8c2c61b881a62318138916753e719f3b',
          },
          {
            name: 'knife',
            id: '7d005b3bcdd759dbe22f359cf0e6e2e7',
          },
          {
            name: 'oven',
            id: '0166fda5ead896da842068c70a858613',
          },
          {
            name: 'microwave',
            id: '91a6618d653ff995b7a0abe3580aa04b',
          },
          {
            name: 'book',
            id: '2ed5687f51efbfd7671d572e22c55bd1',
          },
          {
            name: 'fork',
            id: '8bee1ec927b50755b2821a116b84ebaf',
          },
          {
            name: 'cake',
            id: '71654f44b2afb47f413c618a72f832f1',
          },
          {
            name: 'bench',
            id: '59619ffb52d9fe10f02b02cf92dc6cdf',
          },
          {
            name: 'chair',
            id: '5dacee5d8feb002ed0352dea4c9e56e6',
          },
          {
            name: 'pizza',
            id: '38d74a2b2a8e67c149b083fdc565d363',
          },
          {
            name: 'dining table',
            id: '5767c9d1d5ddb02c0e83ac3ccac185e2',
          },
          {
            name: 'cup',
            id: '7328e6967ba1524e75b8a02ae36547b2',
          },
          {
            name: 'spoon',
            id: 'ad95fb17bc1a038e6b1fb96063071be2',
          },
          {
            name: 'bed',
            id: '832724f58ae36f19ead47bab624860c0',
          },
          {
            name: 'teddy bear',
            id: '05e65361e14f6489c375a2dfecb6e373',
          },
          {
            name: 'refrigerator',
            id: 'c5c0ca9d85d04eb57d2c110a311cd2c6',
          },
          {
            name: 'sink',
            id: '329f817bb1160fe77ab4c714426ab4de',
          },
          {
            name: 'bottle',
            id: 'cf9a67eada699ee4cf0e0bcf45daa4fb',
          },
          {
            name: 'banana',
            id: '5f842baaeb1475f1df746c976beecbf7',
          },
          {
            name: 'sandwich',
            id: '865efcf78a063b2f9722915658ea5fd0',
          },
          {
            name: 'bird',
            id: '38bec3ab4266645ebcf29d229e2e9495',
          },
          {
            name: 'kite',
            id: 'c06db4dde6fb23e557cabba9b5895fb5',
          },
          {
            name: 'wine glass',
            id: '16a37094a0cb30504527d4486f95be2d',
          },
          {
            name: 'tie',
            id: '1dbba42ecf9fe792a73d627c9bbe4dbf',
          },
          {
            name: 'scissors',
            id: '4ebc87af265021ed16f7f698a3562949',
          },
          {
            name: 'baseball bat',
            id: '42d9d10f130718f7769280ee7daf4937',
          },
          {
            name: 'carrot',
            id: 'b175cff0e8b7801dc39013c1e9e3f6e0',
          },
          {
            name: 'snowboard',
            id: 'c7add6b7b6394017a4a037e31f4a6852',
          },
          {
            name: 'toothbrush',
            id: 'd3140b4a33b9e3f035f058de9bc097c1',
          },
          {
            name: 'couch',
            id: 'baf06a1636584040e3ea366970cd637b',
          },
          {
            name: 'remote',
            id: '46f8d3f03ff9f02fa7f3ca2f70b2770b',
          },
          {
            name: 'traffic light',
            id: '75879bbf90297ca753cf227f37fa7d3f',
          },
          {
            name: 'backpack',
            id: '93a6b6a5cdae6593bbf8a25382a88245',
          },
          {
            name: 'bus',
            id: 'eb080701ba0b112c1ad27ea395429a52',
          },
          {
            name: 'suitcase',
            id: 'c5ca9668d56a0ababf2420f493a69474',
          },
          {
            name: 'frisbee',
            id: 'fc7a074def9c902778faf4604afdbc11',
          },
          {
            name: 'hot dog',
            id: '604751d24013e8700be85065b244e686',
          },
          {
            name: 'cell phone',
            id: '5381cd35bdc282a3442a49cb14588df7',
          },
          {
            name: 'baseball glove',
            id: 'db87d78aea2cd6b2398d17b0114c6664',
          },
          {
            name: 'sports ball',
            id: 'db5cfe986e31b6757a3b7c2bdd84a40b',
          },
          {
            name: 'skis',
            id: '89608804e1d45a6ab32cb646b8ad8452',
          },
          {
            name: 'mouse',
            id: '0986979c124fb75d787eb69f66818ed7',
          },
          {
            name: 'laptop',
            id: 'db6152441a3c4208e1628b84786b3d8f',
          },
          {
            name: 'boat',
            id: '508c286732217ddbfbf2f19541235e4d',
          },
          {
            name: 'tennis racket',
            id: '3d1d68b7278395ce9fbc4950587c6e58',
          },
          {
            name: 'donut',
            id: 'b9c699c5a6f67b455817c728e85de5a2',
          },
          {
            name: 'cat',
            id: '3d555beac237f5de006311c7800f45bd',
          },
          {
            name: 'bear',
            id: 'b84ce035dd90ce95c5ef67a12ea5ef17',
          },
          {
            name: 'toilet',
            id: 'c041aed05ee376a8e0ba47d439f9ce5a',
          },
          {
            name: 'tv',
            id: '2e4c98fe65bbc0d3707ffd056a3603c3',
          },
          {
            name: 'apple',
            id: '0474a81e373cc1262a10e1a9beee853a',
          },
          {
            name: 'surfboard',
            id: '85df3072866081465d80b734b7c48fd9',
          },
          {
            name: 'keyboard',
            id: '75f41cd41099c7e868cfd1b2e35280c7',
          },
          {
            name: 'sheep',
            id: 'c68ff341c2665fa9479b3673cbff7ac1',
          },
          {
            name: 'parking meter',
            id: 'ef6844a6e3c7e8c546df04c81c542056',
          },
          {
            name: 'fire hydrant',
            id: 'c059b363fc040c5549bbdc7e50b7171c',
          },
          {
            name: 'cow',
            id: '521fa78e04d465fe4eaf92f803de00db',
          },
          {
            name: 'toaster',
            id: '8fb0dae6f916626e9f244ab4eedbc57a',
          },
          {
            name: 'hair drier',
            id: '695e37970ae14272123c855922cfaa73',
          },
        ],
      },
    });
  },
  'GET  /api/v1/label_task_images/task_id': (req: any, res: any) => {
    const imageList = [
      {
        id: '1',
        task_id: 'str',
        url: 'http://192.168.77.66:8765/files/local_files/b/1/-1_-1/image_jpeg//data/dataset_groups/coco2017/train2017/000000011696.jpg',
        url_full_res:
          'http://192.168.77.66:8765/files/local_files/b/1/-1_-1/image_jpeg//data/dataset_groups/coco2017/train2017/000000011696.jpg',
        labels: [
          {
            id: 'label_1',
            user_id: 'labeler_01',
            user_name: 'labeler_01',
            status: 'labeling',
            created_ts: 123,
            annotations: [
              {
                category_id: 'fbf09dd468a6e482844c5d72671fef4b',
                category_name: 'dog',
                bounding_box: {
                  xmin: 0.0,
                  ymin: 0.3646041666666667,
                  xmax: 0.552234375,
                  ymax: 0.9873124999999999,
                },
                // segmentation:
                //   '202.52,458.34,228.8,437.89,247.3,401.87,248.28,360.0,283.33,321.05,306.69,286.98,316.43,267.51,326.17,291.85,335.9,309.37,353.43,312.29,351.48,280.16,343.69,254.85,329.09,224.67,322.27,220.77,296.96,235.38,281.38,249.01,260.93,235.38,258.99,210.06,237.57,191.56,212.25,181.83,181.1,176.96,159.68,175.01,112.94,190.59,88.6,214.93,71.08,248.03,32.13,303.53,9.74,331.76,2.92,343.45,0.0,467.1,105.15,473.91,189.86,473.91,205.44,460.28,205.44,460.28',
              },
              {
                category_id: 'baf06a1636584040e3ea366970cd637b',
                category_name: 'couch',
                bounding_box: {
                  xmin: 0.0016093750000000001,
                  ymin: 0.2516041666666667,
                  xmax: 0.9290312499999999,
                  ymax: 0.98925,
                },
                // segmentation:
                //   '1.03,273.55,79.48,230.19,29.94,303.48,26.84,324.13,3.1,352.0/268.39,210.58,436.65,120.77,461.42,246.71,497.55,248.77,549.16,376.77,528.52,370.58,382.97,416.0,401.55,384.0,381.94,359.23,368.52,357.16,357.16,341.68,344.77,336.52,341.68,310.71,356.13,313.81,360.26,286.97,357.16,275.61,352.0,266.32,368.52,262.19,377.81,254.97,382.97,236.39,377.81,233.29,373.68,235.35,366.45,218.84,355.1,213.68,338.58,212.65,320.0,219.87,306.58,224.0,298.32,231.23/534.71,381.94,555.35,474.84,594.58,473.81,553.29,385.03',
              },
              {
                category_id: '43d9f8a307984ef1ca01be6db9bca6e8',
                category_name: 'person',
                bounding_box: {
                  xmin: 0.31179687500000003,
                  ymin: 0.4400833333333333,
                  xmax: 0.62528125,
                  ymax: 0.9883958333333334,
                },
                // segmentation:
                //   '328.99,470.11,257.8,404.31,252.4,383.82,310.65,293.21,317.12,285.66,340.85,332.04,361.35,355.78,391.55,366.56,400.18,385.98,368.9,431.28,351.64,452.85/275.06,256.54,266.43,211.24,275.06,212.31,289.08,232.81,296.63,232.81/334.38,219.87,351.64,213.39,372.13,237.12,377.53,250.07,364.58,261.93,350.56,266.25,334.38,232.81,322.52,223.1/228.67,446.38,296.63,474.43,199.55,474.43,212.49,458.25',
              },
              {
                category_id: 'db6152441a3c4208e1628b84786b3d8f',
                category_name: 'laptop',
                bounding_box: {
                  xmin: 0.5561875,
                  ymin: 0.7614166666666667,
                  xmax: 0.866296875,
                  ymax: 0.9816458333333333,
                },
                // segmentation:
                //   '373.21,436.67,529.62,365.48,554.43,470.11,355.96,471.19',
              },
            ],
          },
        ],
        reviews: [
          {
            id: 'review_1',
            user_id: 'reviewer_01',
            user_name: 'reviewer_01',
            action: 'accept',
            label_id: 'label_1',
            created_ts: 123,
          },
        ],
      },
      {
        id: '2',
        task_id: 'str',
        url: 'http://192.168.77.66:8765/files/local_files/b/1/-1_-1/image_jpeg//data/dataset_groups/coco2017/train2017/000000005256.jpg',
        url_full_res:
          'http://192.168.77.66:8765/files/local_files/b/1/-1_-1/image_jpeg//data/dataset_groups/coco2017/train2017/000000005256.jpg',
        labels: [
          {
            id: 'label_2',
            user_id: 'labeler_01',
            user_name: 'labeler_01',
            status: 'labeling',
            created_ts: 123,
            annotations: [
              {
                category_id: '0b8a60499e7fe6d5d9ca90d7def8c86d',
                category_name: 'motorcycle',
                bounding_box: {
                  xmin: 0.03265625,
                  ymin: 0.32365625,
                  xmax: 0.5602968749999999,
                  ymax: 0.9392343750000001,
                },
                // segmentation:
                //   '176.88,287.54,234.77,207.14,270.15,236.09,260.5,266.64,241.21,308.45,250.85,332.57,281.41,351.87,323.22,387.24,348.94,449.96,358.59,501.41,348.94,552.87,307.14,591.46,268.54,568.95,266.93,507.85,276.58,400.11,257.29,384.03,236.38,379.2,220.3,417.8,217.09,470.86,209.05,552.87,178.49,585.03,114.17,594.68,48.24,601.11,27.34,557.7,20.9,456.39,48.24,421.01,98.09,417.8,128.64,421.01,154.37,355.08,109.35,412.97,96.48,393.68,109.35,377.59,125.43,345.43,138.29,321.31,144.72,313.27',
              },
              {
                category_id: '43d9f8a307984ef1ca01be6db9bca6e8',
                category_name: 'person',
                bounding_box: {
                  xmin: 0.375984375,
                  ymin: 0.19632812500000002,
                  xmax: 0.793875,
                  ymax: 0.963125,
                },
                // segmentation:
                //   '391.79,153.77,396.73,140.47,402.43,133.25,411.55,128.31,419.53,126.41,424.09,125.65,428.27,125.65,433.21,126.03,440.05,126.03,443.85,126.41,452.6,132.49,456.78,136.29,459.44,138.95,462.48,143.13,465.14,148.83,466.66,154.91,467.04,166.69,466.28,174.68,465.52,181.9,464.0,181.9,459.06,184.56,456.78,184.56,452.6,189.5,451.45,192.16,451.45,194.06,456.78,193.68,458.68,196.72,459.82,204.32,460.58,206.98,465.9,211.16,472.74,216.48,477.68,221.8,482.24,225.6,485.28,231.3,494.78,238.52,496.68,240.04,498.2,242.32,500.86,246.89,503.9,250.69,508.08,266.17,506.56,272.63,504.66,276.05,500.1,286.69,498.2,291.25,496.3,297.71,494.02,304.93,492.88,311.01,491.36,319.76,490.22,327.36,487.94,333.82,484.52,344.84,482.62,348.26,477.68,355.86,467.04,364.5,465.14,379.7,466.66,388.07,462.86,397.19,458.68,402.51,454.12,409.73,454.12,406.69,446.51,419.23,444.23,423.79,442.71,429.87,436.63,439.37,433.59,444.69,429.03,452.29,424.85,458.38,421.81,463.32,418.39,467.88,426.75,487.92,426.75,493.62,426.37,505.02,425.61,511.48,423.71,520.22,422.95,531.25,421.05,538.47,420.29,541.13,422.19,547.21,425.61,552.15,423.71,558.61,419.53,564.31,418.77,566.59,425.61,570.01,424.09,574.19,424.85,579.89,423.71,585.97,422.57,590.15,426.75,599.68,419.15,611.08,416.87,614.5,371.64,616.4,374.3,542.41,365.18,481.58,365.94,475.12,366.7,469.8,367.46,459.54,375.44,453.45,373.54,444.71,373.16,441.29,380.01,425.19,373.92,411.89,372.78,405.81,372.78,402.77,365.94,399.35,362.14,395.55,357.96,392.51,354.54,389.47,348.84,386.05,345.04,385.29,340.86,384.12,337.06,382.98,323.76,373.48,361.0,354.48,366.32,353.34,370.12,353.34,372.78,352.58,372.78,350.3,369.36,343.84,368.98,337.0,370.12,326.36,368.6,313.82,368.22,305.07,367.08,297.09,367.08,290.25,367.08,284.55,327.42,288.71,320.58,283.01,314.5,279.59,306.13,273.51,299.67,270.09,296.63,266.29,293.97,263.63,290.93,262.87,282.19,266.67,271.93,250.33,265.71,235.62,258.87,229.16,250.89,229.54,245.57,232.2,243.29,229.16,242.15,225.36,240.63,222.32,246.71,219.28,248.99,220.04,252.79,220.8,257.35,221.56,259.63,220.8,263.05,217.38,266.09,214.34,267.23,212.44,268.37,209.4,273.31,210.92,279.77,217.76,281.29,219.66,286.61,225.74,288.51,228.4,298.77,234.86,306.75,240.18,315.88,247.41,326.14,251.97,339.06,255.77,342.48,255.77,355.02,246.65,365.66,240.94,372.12,237.52,377.06,234.86,382.0,230.68,390.37,223.46,397.21,219.66,400.25,217.0,405.19,216.24,408.99,215.1,414.31,212.94,412.41,211.04,406.33,212.94,403.29,210.66,401.01,207.24,402.15,199.64,402.15,197.74,399.49,190.14,399.11,186.34,398.73,184.06,394.93,179.88,400.63,169.23,401.01,166.95,398.35,163.53,392.65,160.49,389.23,158.59',
              },
              {
                category_id: '50d8c39b4a01d1d218ba462b3d0397fb',
                category_name: 'car',
                bounding_box: {
                  xmin: 0.7776875000000001,
                  ymin: 0.286765625,
                  xmax: 0.82775,
                  ymax: 0.30798437500000003,
                },
                // segmentation:
                //   '502.14,186.12,503.67,185.67,504.89,185.51,506.11,185.21,509.16,184.45,512.37,184.29,515.57,183.99,517.71,183.68,519.69,183.53,521.21,183.99,522.28,185.06,523.66,187.95,524.27,188.72,525.49,189.02,526.4,189.02,528.23,189.48,528.38,190.09,529.76,192.07,528.99,194.36,528.38,194.36,526.1,194.82,524.27,194.82,522.74,194.51,521.37,192.84,518.77,192.53,516.79,192.53,513.89,192.68,507.79,195.43,505.35,197.11,503.06,196.65,501.08,194.82,501.08,194.51,500.92,194.36,500.62,193.29,500.31,193.29,497.72,193.29,498.18,192.68,498.18,190.7,498.02,189.02,498.94,188.11,500.31,187.65,502.3,186.58,502.3,186.58',
              },
              {
                category_id: '793e8ebf594a5c737e403d953c9ad27f',
                category_name: 'truck',
                bounding_box: {
                  xmin: 0.03578125,
                  ymin: 0.15757812499999999,
                  xmax: 0.33592187500000004,
                  ymax: 0.30051562499999995,
                },
                // segmentation:
                //   '86.1,103.35,141.81,105.01,161.77,110.0,167.59,131.62,186.72,140.77,214.99,161.56,210.83,179.02,208.34,191.49,195.86,191.49,175.91,192.33,170.92,185.67,157.61,189.83,140.15,189.83,132.66,178.19,84.44,179.02,79.45,100.85/55.33,100.85,22.9,101.69,25.4,182.35,30.38,183.18,33.71,132.46,55.33,129.96,54.5,103.35',
              },
              {
                category_id: 'c5ca9668d56a0ababf2420f493a69474',
                category_name: 'suitcase',
                bounding_box: {
                  xmin: 0.810125,
                  ymin: 0.393578125,
                  xmax: 0.968375,
                  ymax: 0.5853906249999999,
                },
                // segmentation:
                //   '571.58,252.24,560.89,254.2,556.05,258.29,551.22,259.78,538.2,253.82,536.71,256.8,533.73,257.54,523.32,258.66,520.71,259.78,518.48,265.73,519.6,270.56,522.2,274.28,523.32,278.37,525.92,281.35,530.76,281.72,541.92,286.93,547.12,293.25,551.59,292.14,554.19,291.39,562.75,296.6,567.21,302.18,572.04,253.82/604.41,252.71,619.76,251.89,617.38,369.88,600.69,374.65,588.77,368.69,600.69,253.08',
              },
            ],
          },
        ],
        reviews: [
          {
            id: 'review_1',
            user_id: 'reviewer_01',
            user_name: 'reviewer_01',
            action: 'accept',
            label_id: 'label_2',
            created_ts: 123,
          },
        ],
      },
    ];
    const pageNum = Number(req.query.page_num);
    const pageSize = Number(req.query.page_size);
    const list = new Array(pageSize).fill({}).map((_, i) => ({
      ...imageList[i % 2],
      id: 'image_' + pageNum * pageSize + i,
    }));
    res.json({
      code: 0,
      msg: 'success',
      data: {
        imageList: list,
        pageNum,
        pageSize,
        total: pageSize * 10,
      },
    });
  },
  'POST /api/v1/label_task_labels/task_id': (req: any, res: any) => {
    res.json({
      code: 0,
      msg: 'success',
      data: {},
    });
  },
  'POST /api/v1/label_task_reviews/task_id': (req: any, res: any) => {
    res.json({
      code: 0,
      msg: 'success',
      data: {},
    });
  },
};
