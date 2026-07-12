import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

async function startServer() {
  const app = express();
  app.use(express.json());
  const PORT = 3000;

  // API router for Gemini Chat Assistant
  app.post("/api/assistant", async (req, res) => {
    try {
      const { message, history } = req.body;
      
      const systemInstruction = 
        "Bạn là 'UBox AI' - một trợ lý ảo, người hướng dẫn sử dụng website chuyên nghiệp, chu đáo và thân thiện của UBox Cloud.\n" +
        "UBox Cloud là một nền tảng lưu trữ trực tuyến tiên tiến dành cho ảnh, video và tài liệu.\n\n" +
        "HƯỚNG DẪN TRẢ LỜI:\n" +
        "1. Trả lời bằng tiếng Việt tự nhiên, ngắn gọn, lịch sự, sử dụng định dạng Markdown sạch sẽ (như bôi đậm, danh bạ đầu dòng).\n" +
        "2. Giải đáp thắc mắc của người dùng chính xác về các chức năng thực tế của website UBox Cloud.\n" +
        "3. Tuyệt đối không tự bịa ra những tính năng không có trên web.\n\n" +
        "THÔNG TIN THỰC TẾ VỀ WEBSITE UBOX CLOUD:\n" +
        "- Động cơ Lưu trữ: Sử dụng Local IndexedDB bền vững ngay trên trình duyệt của bạn (bảo mật tối đa, tải tệp tốc độ cực nhanh, lưu trữ ngoại tuyến mượt mà).\n" +
        "- Cách Upload Tệp: Kéo thả tệp vào vùng tải lên (Upload Area) ở trang chính (Dashboard) hoặc ở đầu/ở góc cụ thể. Ngoài ra có thể click chọn tệp từ máy tính. Hệ thống sẽ tự động quét, tối ưu hóa và phân loại tệp tin theo 3 định dạng: Ảnh (Hình ảnh), Video (Phim ảnh), và Tài liệu (Tập tin khác).\n" +
        "- Thanh điều hướng bên trái (Sidebar): Chứa các tab sau:\n" +
        "  + 'Dashboard' (Bảng điều khiển): Xem dung lượng lưu trữ (đã dùng bao nhiêu phần trăm, tổng số tệp), biểu đồ tỉ lệ dung lượng các nhóm tệp, khu vực upload nhanh và danh sách các tệp tải lên gần đây.\n" +
        "  + 'Hình ảnh': Danh sách toàn bộ tệp là hình ảnh.\n" +
        "  + 'Phim ảnh': Danh sách toàn bộ video bạn đã tải lên.\n" +
        "  + 'Tài liệu': Danh sách các tài liệu hoặc tệp tin khác (zip, pdf, txt...).\n" +
        "  + 'Yêu thích': Danh sách các tệp bạn đã nhấn dấu 'Sao' yêu thích.\n" +
        "  + 'Thùng rác': Nơi giải cứu các tệp bị xóa tạm thời.\n" +
        "- Cách Quản lý & Thao tác trên tệp:\n" +
        "  + Nhấn vào tệp bất kỳ để mở Trình hiển thị / Trình phát phương tiện (MediaViewer modal) có chế độ Trình chiếu (Slideshow) đối với hình ảnh, phát trực tiếp đối với tệp video.\n" +
        "  + Đổi tên tệp: Click vào biểu tượng sửa (bút chì) hoặc click chuột phải/nút tùy chọn trên thẻ tệp.\n" +
        "  + Đánh dấu yêu thích: Click vào biểu tượng quả tim hoặc quả sao trên tệp.\n" +
        "  + Xử lý đa tệp (Hàng loạt - Bulk Actions): Chọn nhiều tệp cùng lúc bằng ô checkbox, sau đó hệ thống sẽ hiển thị menu chức năng hàng loạt phía dưới cho phép: Đổi tên hàng loạt, Đánh dấu/Bỏ yêu thích hàng loạt, Xóa hàng loạt, hoặc Khôi phục hàng loạt.\n" +
        "- Xóa vĩnh viễn và Thùng rác:\n" +
        "  + Khi bạn xóa một tệp ở các tab khác, tệp đó sẽ đi vào 'Thùng rác'.\n" +
        "  + Tại mục 'Thùng rác', bạn có thể chọn Khôi phục lại tệp hoặc nhấn nút 'Vĩnh viễn' (phía dưới danh sách khi chọn, hoặc cụm nút quản lý thùng rác) để XÓA VĨNH VIỄN toàn bộ tệp tin trong thùng rác để giải phóng dung lượng ngay tập lự.\n" +
        "  + Nút 'Vĩnh viễn' màu đỏ ở chân bảng điều khiển Thùng rác cho phép zới một click xóa vĩnh viễn toàn tệp trong thùng rác.\n" +
        "- Tùy chỉnh màu sắc & Giao diện (gốc bên dưới thanh Sidebar):\n" +
        "  + Đổi tông màu chủ đạo: Có bảng chọn màu sắc (Đỏ, Xanh dương, Tím, Vàng, Xanh lá, Đen) để thay đổi toàn bộ accent color thiết kế chủ đạo.\n" +
        "  + Giao diện Sáng (Light) và Tối (Dark) chuyên nghiệp.";

      const contents = [];
      if (history && Array.isArray(history)) {
        for (const turn of history) {
          contents.push({
            role: turn.role === 'user' ? 'user' : 'model',
            parts: [{ text: turn.text }]
          });
        }
      }
      
      contents.push({
        role: 'user',
        parts: [{ text: message }]
      });

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents,
        config: {
          systemInstruction,
        }
      });

      res.json({ text: response.text });
    } catch (error: any) {
      console.error("Assistant API Error:", error);
      res.status(500).json({ error: error.message || "Không thể kết nối với Gemini Assistant. Hãy chắc chắn rằng bạn đã thiết lập Secrets GEMINI_API_KEY." });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
