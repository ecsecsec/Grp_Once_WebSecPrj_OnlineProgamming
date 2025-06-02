#include <iostream>
#include <fstream>
using namespace std;

int main() {
    ifstream file("user_code.cpp");
    string line;
    while (getline(file, line)) {
        cout << line << endl;
    }
    // Hoặc bạn biên dịch user_code.cpp ở đây
    return 0;
}
