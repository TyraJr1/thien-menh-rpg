import { art, chapters } from './art';
import type { Chapter } from './types';

const yan = new URL('../art/yan.webp', import.meta.url).href;
const shade = new URL('../art/shade.webp', import.meta.url).href;

export const chapter: Chapter = {
  id: 'chapter01',
  ...chapters.chapter01,
  background: art.chapter01,
  scenes: [
    {
      x: 335, name: 'Yên Ly', label: 'Kiếm khách Tàng Phong', sprite: yan,
      objective: 'Trao Mộc Ấn cho Yên Ly.',
      lines: state => [
        state.stance === 'compassion'
          ? 'Lão Chu đã đưa mọi người qua sông. Ông ấy nhờ ta nói rằng bến đò vẫn đợi cậu về.'
          : 'Dấu trên mảnh vải thuộc về Vô Danh. Hắn từng giữ sơn môn này trước khi lời thề bị phá.',
        'Mộc Ấn là chìa khóa mở sơn môn. Đặt nó lên Bia Khắc Gió và xem bia đáp lại thế nào.',
      ],
      choices: [{ text: 'Nhận lời.' }],
    },
    {
      x: 545, name: 'Bia Khắc Gió', label: 'Cổ vật Tàng Phong',
      objective: 'Đặt Mộc Ấn lên Bia Khắc Gió.',
      lines: () => [
        'Bia đá ngân lên khi chạm Mộc Ấn. Trong lòng bia hiện ra một nét kiếm còn dang dở.',
        'Bên chân bia, bồ đoàn vẫn còn ấm. Bạn có thể thử vận khí theo đường khắc trong đá.',
      ],
      choices: [{ text: 'Đến tọa thiền.' }],
    },
    {
      x: 655, name: 'Bồ đoàn đá', label: 'Nơi tu luyện',
      objective: 'Tọa thiền và chọn một tâm pháp.',
      lines: () => [
        'Bạn nghe tiếng gió tách làm hai. Một luồng lắng xuống, một luồng sắc như đường kiếm.',
        'Chọn một cách vận khí. Sinh Tức hồi thêm 1 Khí khi thủ thế. Phá Phong tăng 3 sát thương cho kiếm kỹ.',
      ],
      choices: [
        { text: 'Học Sinh Tức.', stance: 'compassion' },
        { text: 'Học Phá Phong.', stance: 'resolve' },
      ],
    },
    {
      x: 810, name: 'Hộ vệ Vô Danh', label: 'Người giữ sơn môn', sprite: shade,
      objective: 'Vượt qua Hộ vệ Vô Danh.',
      lines: () => ['Một đường kiếm còn thiếu, một lời thề chưa trọn. Cho ta xem tâm pháp mà cậu vừa chọn.'],
      choices: [{ text: 'Nhận lời thách đấu.' }],
    },
    {
      x: 870, name: 'Yên Ly', label: 'Trước sơn môn', sprite: yan,
      objective: 'Gặp lại Yên Ly trước sơn môn.',
      lines: state => [
        state.technique === 'compassion'
          ? 'Vô Danh đã hạ kiếm khi thấy cậu giữ được nhịp thở dưới đòn nặng. Có lẽ đó mới là lời giải của tấm bia.'
          : 'Cậu đã nối được nét kiếm cuối trên bia. Vô Danh công nhận nét kiếm ấy và mở đường.',
        'Nhìn qua cổng đi. Ngọn đèn kia vừa tắt. Có người đã vào Tàng Phong trước cả chúng ta.',
      ],
      choices: [{ text: 'Khép lại chương.' }],
    },
  ],
  ending: 'Sơn môn mở. Yên Ly và bạn dừng trước con đường chìm trong mây, nơi dấu chân người đi trước vẫn còn mới.',
};
