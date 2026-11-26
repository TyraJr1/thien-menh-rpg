import { art, chapters } from './art';
import type { Chapter } from './types';

const ferryman = new URL('../art/ferryman.webp', import.meta.url).href;
const shade = new URL('../art/shade.webp', import.meta.url).href;

export const chapter: Chapter = {
  id: 'prologue',
  ...chapters.prologue,
  background: art.prologue,
  scenes: [
    {
      x: 375, name: 'Lão Chu', label: 'Người lái đò', sprite: ferryman,
      objective: 'Tìm Lão Chu bên bến đò.',
      lines: () => [
        'Đêm qua có người để lại chiếc Mộc Ấn trên thuyền. Họ dặn ta giao cho người mang tua kiếm màu lục.',
        'Ta giữ lời được đến đây thôi. Kẻ áo đen đã lục cả xóm để tìm nó. Cậu định làm gì?',
      ],
      choices: [
        { text: 'Đưa dân làng sang bờ an toàn.', stance: 'compassion' },
        { text: 'Giữ ông ở đây. Tôi sẽ dẫn hắn đi.', stance: 'resolve' },
      ],
    },
    {
      x: 570, name: 'Đèn dẫn lối', label: 'Bậc đá bến sông',
      objective: 'Xem tín hiệu bên ngọn đèn đá.',
      lines: state => [
        state.stance === 'compassion'
          ? 'Từng chiếc thuyền rời bến trong im lặng. Lão Chu để lại dưới đèn một mảnh giấy: “Tìm Yên Ly ở Tàng Phong.”'
          : 'Lão Chu tắt đèn bên bến. Trong khoảnh khắc tối xuống, bạn thấy mấy vết khắc trên Mộc Ấn: “Tàng Phong, Yên Ly.”',
        'Tiếng đế giày dừng trên đá. Có người đang chặn lối lên núi.',
      ],
      choices: [{ text: 'Đi về phía tiếng động.' }],
    },
    {
      x: 778, name: 'Khách áo đen', label: 'Kẻ chặn đường', sprite: shade,
      objective: 'Đối mặt với kẻ chặn đường.',
      lines: () => ['Để Mộc Ấn xuống. Ta sẽ để chiếc thuyền cuối cùng rời bến.'],
      choices: [{ text: 'Rút kiếm.' }],
    },
    {
      x: 875, name: 'Đường lên núi', label: 'Lối rời bến',
      objective: 'Theo lối đá rời bến Vân Thủy.',
      lines: state => [
        state.stance === 'compassion'
          ? 'Ánh đèn trên chiếc thuyền cuối khuất sau khúc sông. Bạn đợi đến khi không còn nghe tiếng mái chèo rồi mới đi.'
          : 'Bạn tìm thấy mảnh vải in dấu sơn môn trên lưỡi kiếm rơi lại. Kẻ đó đã đi trước bạn qua lối này.',
      ],
      choices: [{ text: 'Rời bến Vân Thủy.' }],
    },
  ],
  ending: 'Mộc Ấn ấm dần trong tay. Trên sườn núi, tiếng chuông Tàng Phong vang lên giữa màn sương.',
};
