# MASTER PROMPT V4.0 — THIÊN MỆNH UNIVERSE
## CINEMATIC 3D THIRD-PERSON ACTION RPG

## 1. NHIỆM VỤ CHÍNH

Hãy đảm nhiệm vai trò Game Director, Lead 3D Game Developer, Technical Artist, Gameplay Engineer, Animation Engineer, World Designer, Narrative Designer, UI/UX Designer, Performance Engineer và Cloud DevOps Engineer.

Tôi không hài lòng với trải nghiệm game hiện tại vì giao diện vẫn giống website, nhân vật chủ yếu mang cảm giác sprite 2D trên ảnh nền, chiến đấu đơn điệu và chưa tạo được cảm giác nhập vai thực sự.

Hãy nâng cấp dự án thành một game 3D Third-Person Action RPG cao cấp, lấy cảm hứng về trải nghiệm khám phá, camera, điều khiển, chiến đấu và chất lượng trình bày từ Genshin Impact, kết hợp phong cách Chinese Donghua, Wuxia và Xianxia.

Không sao chép nhân vật, bản đồ, âm nhạc, giao diện đặc trưng, tài nguyên hoặc cốt truyện của Genshin Impact.

Xây dựng bản sắc nguyên bản cho Thiên Mệnh.

Không chỉ thay đổi CSS, phóng to ảnh nền hoặc thêm hiệu ứng 2D rồi gọi đó là game 3D.

## 2. REPOSITORY VÀ BẢO VỆ PHIÊN BẢN HIỆN TẠI

Repository:

https://github.com/TyraJr1/thien-menh-rpg

Đọc toàn bộ mã nguồn hiện tại, AGENTS.md, MASTER_PROMPT.md nếu tồn tại, GAME_DESIGN.md, STORY_BIBLE.md, ROADMAP.md và PROJECT_STATUS.md.

Giữ nguyên phiên bản đang hoạt động trên nhánh dev/chapter-01.

Tạo nhánh phát triển riêng:

feature/3d-action-rpg

Tạo từ commit mới nhất đã được kiểm thử của phiên bản hiện tại.

Không ghi đè phiên bản game đang được Cloudflare hosting.

Không tự ý merge vào main.

Tái sử dụng những hệ thống logic hiện có nếu phù hợp:

- Cốt truyện.
- Chapter System.
- Narrative Engine.
- Dialogue System.
- Quest System.
- Save System.
- Cultivation System.
- Inventory.
- Character Data.
- Relationship System.
- Share Game.

Chuyển đổi có kiểm soát, không xóa toàn bộ dự án nếu không cần thiết.

## 3. CÔNG NGHỆ ĐỒ HỌA 3D

Sử dụng:

- Babylon.js.
- TypeScript strict mode.
- Vite.
- WebGPU khi được hỗ trợ.
- WebGL 2 fallback.
- glTF và GLB.
- Skeletal Animation.
- Animation Blending.
- PBR Materials.
- Custom Toon Shaders.
- Physically Based Lighting.
- Cel Shading.
- Efficient Physics hoặc character controller nhẹ.

Chỉ sử dụng những thư viện thực sự cần thiết.

Phaser có thể được giữ lại cho bản legacy nhưng không được tải đồng thời hai engine nếu không cần thiết.

Tách bản 3D khỏi bản legacy bằng entry point hoặc cấu trúc phù hợp.

## 4. FULLSCREEN GAME EXPERIENCE

Loại bỏ giao diện dashboard, sidebar lớn và bố cục website truyền thống trong gameplay.

Game phải chiếm toàn bộ viewport.

Yêu cầu:

- Full viewport canvas.
- Fullscreen API khi trình duyệt hỗ trợ.
- Responsive viewport.
- Không cuộn trang trong gameplay.
- Hỗ trợ dynamic viewport trên mobile.
- Safe area cho điện thoại.
- Giao diện overlay trong game.
- HUD tự động ẩn khi xem cutscene.
- Cinematic loading screen.
- Pause menu.
- Settings overlay.
- World map overlay.
- Inventory overlay.
- Chapter journal overlay.

Full screen chỉ kích hoạt sau thao tác của người chơi theo yêu cầu trình duyệt.

Khi fullscreen không khả dụng, sử dụng toàn bộ viewport.

## 5. THIRD-PERSON CHARACTER CONTROLLER

Xây dựng hệ thống điều khiển nhân vật 3D thực thụ.

Hỗ trợ:

- Đi bộ.
- Chạy.
- Sprint.
- Nhảy.
- Né tránh.
- Xoay người theo hướng di chuyển.
- Di chuyển theo hướng camera.
- Trọng lực.
- Ground detection.
- Collision detection.
- Va chạm tường và vật thể.
- Animation đứng.
- Animation đi bộ.
- Animation chạy.
- Animation nhảy.
- Animation tiếp đất.
- Animation chiến đấu.

Sử dụng acceleration và deceleration phù hợp để chuyển động mượt.

Không để nhân vật trượt trên mặt đất hoặc xuyên qua vật thể.

Chuẩn bị kiến trúc cho leo trèo, bơi lội, ngự kiếm và khinh công trong tương lai.

## 6. CAMERA SYSTEM

Xây dựng third-person camera chuyên nghiệp.

Hỗ trợ:

- Camera theo sau nhân vật.
- Xoay 360 độ.
- Camera zoom.
- Mouse look.
- Touch camera.
- Camera smoothing.
- Camera collision.
- Tránh xuyên tường.
- Camera lock-on.
- Camera combat.
- Cinematic camera.
- Camera dialogue.
- Camera shake có kiểm soát.

Camera phải tạo cảm giác giống một game nhập vai 3D thực sự.

Không rung quá mức hoặc gây khó chịu.

## 7. ĐỒ HỌA DONGHUA 3D CAO CẤP

Art Direction:

- Chinese Donghua.
- Oriental Fantasy.
- Stylized Anime 3D.
- Wuxia.
- Xianxia.
- Hand-painted textures.
- Cinematic fantasy.
- Cel-shaded characters.
- Atmospheric landscapes.

Ưu tiên:

- Nhân vật có hình dáng tự nhiên.
- Trang phục cổ trang nhiều lớp.
- Tóc và phụ kiện.
- Chất liệu vải.
- Vũ khí nguyên bản.
- Môi trường có chiều sâu thực.
- Ánh sáng hài hòa.
- Màu sắc điện ảnh.
- Đổ bóng tự nhiên.
- Water shaders.
- Sky rendering.
- Atmospheric fog.
- Grass and foliage.
- Wind animation.
- Ambient particles.

Không sử dụng hình khối đơn giản làm tài nguyên phát hành hoàn chỉnh.

Nếu chưa có model chất lượng cao, sử dụng model prototype hợp pháp để chứng minh gameplay và ghi rõ trạng thái.

Không tuyên bố đạt chất lượng AAA nếu chưa có tài nguyên tương ứng.

## 8. ASSET PIPELINE

Xây dựng quy trình tài nguyên 3D chuyên nghiệp:

- GLB/glTF.
- Mesh compression.
- Meshopt hoặc Draco nếu phù hợp.
- KTX2/Basis Universal.
- Texture compression.
- Texture atlas.
- Skeletal animation.
- Animation clips.
- Level of Detail.
- GPU instancing.
- Baked lighting.
- Asset manifests.
- Asset versioning.
- Lazy asset loading.

Tạo ART_DIRECTION_3D.md.

Tạo ASSET_REQUIREMENTS.md ghi rõ:

- Model nhân vật chính.
- Model NPC.
- Model kẻ địch.
- Model Boss.
- Trang phục.
- Vũ khí.
- Nhà cổ trang.
- Cây trúc.
- Cây cối.
- Núi đá.
- Địa hình.
- Cầu.
- Thác nước.
- Animation.
- Texture.
- Hiệu ứng.

Kiểm tra giấy phép và nguồn của mọi tài nguyên bên ngoài.

Không tạo liên kết tài nguyên giả.

Không yêu cầu tôi cài Blender hoặc phần mềm 3D trên máy cá nhân.

## 9. THẾ GIỚI 3D

Xây dựng khu vực đầu tiên dựa trên cốt truyện hiện tại.

Ưu tiên một khu vực nhỏ nhưng có chất lượng cao thay vì thế giới rộng và trống rỗng.

Vertical Slice đầu tiên gồm:

- Bến Vân Thủy hoặc khu vực mở đầu hiện có.
- Một làng cổ trang.
- Một con đường rừng trúc.
- Một khu vực giao đấu.
- Một điểm tương tác NPC.
- Một nhiệm vụ chính hoàn chỉnh.
- Một cuộc chiến với Boss hoặc mini-boss.

Môi trường phải có:

- Terrain.
- Walkable areas.
- Collision.
- Vegetation.
- Rocks.
- Ancient buildings.
- Paths.
- Water.
- NPC spawn points.
- Enemy spawn points.
- Quest markers.
- Lighting.
- Atmospheric fog.
- Exploration points.

Chuẩn bị world chunk system để mở rộng bản đồ theo khu vực.

Không tải toàn bộ thế giới vào RAM.

## 10. REAL-TIME ACTION COMBAT

Thay trải nghiệm chiến đấu theo lượt của chế độ 3D bằng chiến đấu thời gian thực.

Hỗ trợ:

- Tấn công thường.
- Combo cơ bản.
- Kiếm thuật.
- Né tránh.
- Phòng thủ.
- Kỹ năng chủ động.
- Tuyệt kỹ.
- Cooldown.
- Stamina.
- Nội lực.
- Linh lực.
- Hit detection.
- Damage calculation.
- Hit reaction.
- Enemy telegraph.
- Lock-on target.
- Death animation.
- Victory rewards.

Kẻ địch phải có hành vi:

- Idle.
- Patrol.
- Detect player.
- Chase.
- Attack.
- Defend.
- Retreat.
- Stagger.
- Defeated.

Sử dụng state machine và animation events phù hợp.

Không chỉ hiển thị số sát thương và thay đổi thanh máu.

Đòn đánh phải có chuyển động, thời điểm va chạm, âm thanh và phản hồi trực quan.

## 11. CINEMATIC STORY SYSTEM

Giữ định hướng game nhập vai theo Chapter.

Cốt truyện vẫn là trọng tâm.

Nâng cấp hội thoại thành:

- Character close-up.
- Dialogue camera.
- Camera switching.
- Facial expressions nếu asset hỗ trợ.
- Character gestures.
- Cinematic subtitles.
- Branching choices.
- Skippable cutscenes.
- Story events.
- Quest transitions.

Khi người chơi đến gần NPC, hiển thị nút tương tác trong thế giới.

Khi hội thoại bắt đầu, camera tự động chuyển sang góc quay phù hợp.

Sau khi hội thoại kết thúc, trở lại gameplay một cách mượt mà.

Giữ tính nhất quán với STORY_BIBLE và dữ liệu lựa chọn cũ.

## 12. GAME HUD

Thiết kế HUD tối giản, cao cấp và không che khuất thế giới.

Góc trên bên trái:

- Minimap.
- Vị trí.
- Nhiệm vụ đang theo dõi.
- Khoảng cách mục tiêu khi khả dụng.

Góc trên bên phải:

- Bản đồ.
- Nhân vật.
- Túi đồ.
- Cài đặt.
- Pause.

Phía dưới:

- Thanh sinh lực.
- Nội lực.
- Linh lực.
- Cấp độ.

Góc dưới bên phải:

- Tấn công.
- Kỹ năng.
- Tuyệt kỹ.
- Né tránh.
- Nhảy.

Điện thoại:

- Virtual joystick bên trái.
- Camera swipe.
- Nút chiến đấu bên phải.
- Điều khiển đa điểm chạm.

Máy tính:

- WASD di chuyển.
- Space nhảy.
- Chuột xoay camera.
- Chuột trái tấn công.
- Shift chạy hoặc né tránh.
- F tương tác.
- Q, E, R cho kỹ năng.
- M mở bản đồ.
- Esc mở Pause Menu.

Cho phép tùy chỉnh phím điều khiển khi phù hợp.

## 13. WORLD INTERACTION

Chuẩn bị hệ thống tương tác với:

- NPC.
- Cửa.
- Rương.
- Vật phẩm.
- Điểm dịch chuyển.
- Linh thảo.
- Điểm tu luyện.
- Sự kiện cốt truyện.
- Khu vực bí mật.

Bổ sung world-space markers và quest navigation.

Tương tác phải có khoảng cách hợp lệ.

Không sử dụng giao diện website làm cách tương tác chính.

## 14. PERFORMANCE ENGINEERING

Tất cả quá trình viết code, cài thư viện, build và kiểm thử phải diễn ra trên Cloud.

Không tải toàn bộ repository xuống máy cá nhân.

Không yêu cầu cài Unity, Unreal Engine hoặc Blender.

Áp dụng:

- Frustum culling.
- Occlusion optimization khi phù hợp.
- LOD.
- Mesh instancing.
- Thin instances.
- Texture compression.
- Dynamic resolution.
- Adaptive quality.
- Lazy loading.
- Chunk-based loading.
- Scene unloading.
- Memory disposal.
- Object pooling.
- Animation throttling.
- Particle budgets.
- Shadow budgets.
- Draw call optimization.
- Asset streaming.
- Frame rate control.

Cung cấp các chế độ:

Battery Saver:
- 30 FPS.
- Độ phân giải thấp.
- Giảm hiệu ứng.

Low:
- Texture nhỏ.
- Giảm hoặc tắt shadow động.
- Giảm vegetation.
- Giảm particle.

Medium:
- Chất lượng cân bằng.

High:
- Ánh sáng tốt hơn.
- Texture chi tiết.
- Hiệu ứng môi trường nâng cao.

Ultra:
- Chất lượng hình ảnh cao nhất trong phạm vi thiết bị hỗ trợ.

Auto:
- Tự điều chỉnh chất lượng dựa trên hiệu năng thực tế.

Mục tiêu 30 FPS cho thiết bị yếu có hỗ trợ 3D và 60 FPS cho thiết bị phù hợp.

Đặt ngân sách tải ban đầu khoảng 5 MB cho menu và phần khởi động, sau đó tải khu vực 3D theo nhu cầu. Hướng tới 15–30 MB cho khu vực thử nghiệm đầu tiên, điều chỉnh theo chất lượng tài nguyên thực tế.

Không giả định mọi thiết bị đều đạt các mục tiêu.

Không tải toàn bộ tài nguyên của tất cả Chapter.

Không lưu cache offline dung lượng lớn.

Báo cáo số liệu đo thực tế.

## 15. CLOUD ARCHITECTURE

Tiếp tục sử dụng:

- GitHub.
- Codex Cloud.
- Cloudflare Workers Static Assets.
- Cloudflare CDN.
- Wrangler.
- Vite production build.

Giữ tương thích với cấu hình:

Worker: thien-menh-rpg

Build command:
npm run build

Deploy command:
npx wrangler deploy --assets=./dist

Không tự ý triển khai phiên bản thử nghiệm 3D lên production đang hoạt động.

Sử dụng Worker Preview hoặc môi trường preview riêng nếu có quyền.

Nếu tài nguyên 3D vượt giới hạn kích thước file của Cloudflare Static Assets, hãy nén hoặc chia nhỏ tài nguyên.

Chuẩn bị phương án sử dụng Cloud Storage và CDN trong tương lai.

Không tự ý tạo tài nguyên tính phí.

## 16. CLOUD GAMING FUTURE

Tạo tài liệu đánh giá riêng về khả năng chuyển sang Unreal Engine và Pixel Streaming trong tương lai.

Phân tích:

- Cloud GPU.
- WebRTC.
- Game streaming.
- GPU rendering.
- Độ trễ.
- Chi phí vận hành.
- Số lượng người chơi đồng thời.

Chưa triển khai hệ thống này trong giai đoạn hiện tại.

Không sử dụng Cloudflare Workers như một GPU rendering server.

## 17. TESTING

Thực hiện kiểm thử:

- Character movement.
- Camera rotation.
- Camera collision.
- Ground detection.
- Character collisions.
- Jump.
- Combat.
- Hit detection.
- Enemy AI.
- NPC interaction.
- Dialogue branching.
- Quest progression.
- Save and load.
- Full viewport.
- Fullscreen.
- Touch controls.
- Asset loading.
- Resource disposal.
- Production build.

Chạy kiểm thử trình duyệt khi môi trường hỗ trợ.

Kiểm tra WebGL 2 fallback.

Kiểm tra trên nhiều viewport desktop và mobile.

Nếu môi trường chỉ hỗ trợ software rendering, ghi rõ giới hạn benchmark và không dùng số liệu đó để đảm bảo hiệu năng trên máy thật.

Tạo ảnh chụp thực tế:

- Main Menu.
- Third-person exploration.
- NPC interaction.
- Cinematic dialogue.
- Combat.
- Mobile HUD.

## 18. QUY TRÌNH PHÁT TRIỂN

Phase A — 3D Foundation:

- Tách bản 3D khỏi legacy.
- Khởi tạo Babylon.js.
- Fullscreen canvas.
- 3D scene.
- Character controller.
- Third-person camera.
- Collision.
- Animation.

Phase B — Visual Vertical Slice:

- Tạo một môi trường cổ trang 3D.
- Model nhân vật.
- Ánh sáng.
- Terrain.
- Water.
- Vegetation.
- HUD.
- NPC interaction.

Phase C — Real-Time Combat:

- Animation.
- Đòn đánh.
- Kỹ năng.
- Né tránh.
- Enemy AI.
- Hit detection.
- Boss hoặc mini-boss.

Phase D — Story Integration:

- Hội thoại.
- Nhiệm vụ.
- Cutscene.
- Chapter progression.
- Lưu tiến trình.

Phase E — Optimization and Preview:

- Tối ưu asset.
- Đo hiệu năng.
- Kiểm thử.
- Production build.
- Preview deployment.

Không thực hiện toàn bộ game thế giới mở trong một tác vụ.

Trong tác vụ hiện tại, ưu tiên Phase A và tạo một phần Phase B có thể chơi được.

Chỉ chuyển sang Phase tiếp theo khi nền tảng hoạt động ổn định.

## 19. TIÊU CHÍ NGHIỆM THU

Phiên bản 3D đầu tiên phải có:

- Game canvas chiếm toàn bộ màn hình.
- Nhân vật 3D có thể điều khiển.
- Camera xoay tự do.
- Animation đứng, đi và chạy.
- Địa hình 3D có thể di chuyển.
- Va chạm vật thể.
- Ít nhất một NPC tương tác được.
- HUD dạng game nhập vai.
- Hỗ trợ bàn phím và cảm ứng.
- Cài đặt chất lượng đồ họa thực sự có tác dụng.
- Production build thành công.

Không nghiệm thu nếu game vẫn chủ yếu là ảnh nền tĩnh và giao diện website.

## 20. CHỈ THỊ CUỐI CÙNG

Hãy trực tiếp thực hiện mã nguồn trong Codex Cloud.

Tạo nhánh feature/3d-action-rpg.

Bảo vệ game hiện tại.

Tập trung tạo một trải nghiệm 3D nhập vai thực sự, toàn màn hình, chuyển động mượt, có chiều sâu và mang phong cách hoạt hình cổ trang Trung Quốc.

Không chỉ tạo mockup.

Không chỉ sửa CSS.

Không chỉ cung cấp kế hoạch.

Không tuyên bố chất lượng tương đương Genshin Impact nếu chưa có bằng chứng.

Sau khi hoàn thành, hãy báo cáo:

- Tính năng hoạt động.
- Tính năng chưa hoàn thành.
- Engine được sử dụng.
- Tài nguyên nghệ thuật thực tế.
- Kết quả kiểm thử.
- Dung lượng tải.
- FPS đã đo nếu có.
- Ảnh chụp game.
- Commit.
- Pull Request.
- URL preview thực tế nếu có.
- Các bước nâng cấp tiếp theo.