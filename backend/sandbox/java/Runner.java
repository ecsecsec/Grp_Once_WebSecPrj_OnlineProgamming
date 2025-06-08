package backend.sandbox.java;



import java.nio.file.*;
public class Runner {
    public static void main(String[] args) throws Exception {
        String code = Files.readString(Path.of("UserCode.java"));
        System.out.println(code);
        // Thực thi: biên dịch và chạy UserCode.java nếu cần
    }
}
