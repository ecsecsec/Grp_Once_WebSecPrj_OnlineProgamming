import { useState } from 'react';
import './Contest.css';

function ContestScreen() {
    const [activeTab, setActiveTab] = useState('upcoming');

    const contests = [
        {
            id: 'C001',
            title: 'Kỳ thi Lập trình mùa xuân',
            time: '2025-06-01 14:00',
            topic: 'Thuật toán',
            registered: 200,
            status: 'Sắp diễn ra',
            image: 'https://via.placeholder.com/300x150?text=Contest+1',
            finished: false
        },
        {
            id: 'C002',
            title: 'Kỳ thi Hè 2024',
            time: '2024-08-20 09:00',
            topic: 'Cấu trúc dữ liệu',
            registered: 180,
            status: 'Đã kết thúc',
            image: 'https://via.placeholder.com/300x150?text=Contest+2',
            finished: true,
            participants: 160,
            ranking: ['Alice', 'Bob', 'Charlie']
        }
    ];

    const filteredContests = contests.filter(c => activeTab === 'upcoming' ? !c.finished : c.finished);

    return (
        <div className="contest-container">
            <div className="tab-buttons">
                <button className={activeTab === 'upcoming' ? 'active' : ''} onClick={() => setActiveTab('upcoming')}>Đang & Sắp diễn ra</button>
                <button className={activeTab === 'past' ? 'active' : ''} onClick={() => setActiveTab('past')}>Kỳ thi đã qua</button>
            </div>

            <div className="contest-list">
                {filteredContests.map(contest => (
                    <div key={contest.id} className="contest-card">
                        <img src={contest.image} alt="cover" />
                        <div className="contest-info">
                            <h3>{contest.title}</h3>
                            <p><strong>Thời gian:</strong> {contest.time}</p>
                            <p><strong>Chủ đề:</strong> {contest.topic}</p>
                            <p><strong>Đăng ký:</strong> {contest.registered} người</p>
                            <p><strong>Trạng thái:</strong> {contest.status}</p>

                            {contest.finished && (
                                <>
                                    <p><strong>Tham gia:</strong> {contest.participants} người</p>
                                    <div className="ranking">
                                        <strong>Bảng xếp hạng:</strong>
                                        <ol>
                                            {contest.ranking.map((name, index) => (
                                                <li key={index}>{name}</li>
                                            ))}
                                        </ol>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default ContestScreen;
