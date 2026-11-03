'use client';

import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Newspaper,
  BookOpen,
  Scale,
  CheckCircle,
  HelpCircle,
  Image as ImageIcon,
  MessageSquare,
  Clock,
  BarChart3,
  Settings,
  ShieldAlert,
  Users,
  Search,
  Sparkles,
  Send,
  RefreshCw,
  Plus,
  Trash2,
  ExternalLink,
  ChevronRight,
  AlertTriangle,
} from 'lucide-react';
import { apiClient } from '@/lib/api';

type TabType =
  | 'overview'
  | 'news'
  | 'educational'
  | 'cases'
  | 'quizzes'
  | 'media'
  | 'questions'
  | 'approvals'
  | 'scheduler'
  | 'analytics'
  | 'settings'
  | 'sources'
  | 'users'
  | 'audit';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [posts, setPosts] = useState<any[]>([]);
  const [approvalQueue, setApprovalQueue] = useState<any[]>([]);
  const [sources, setSources] = useState<any[]>([]);
  const [questions, setQuestions] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  // Generation dialog states
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [genType, setGenType] = useState<'news' | 'educational' | 'case' | 'quiz'>('news');
  const [genTopic, setGenTopic] = useState('');
  const [genDomain, setGenDomain] = useState('CIVIL');
  const [generating, setGenerating] = useState(false);
  const [autonomousMode, setAutonomousMode] = useState<'1' | '2'>('2');
  const [runningAutopilot, setRunningAutopilot] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    loadData();
    fetchMode();
  }, [activeTab]);

  const fetchMode = async () => {
    try {
      const res = await apiClient.get('/scheduler/mode');
      if (res?.data?.mode) setAutonomousMode(res.data.mode);
    } catch (_) {}
  };

  const handleToggleMode = async (newMode: '1' | '2') => {
    try {
      await apiClient.post('/scheduler/mode', { mode: newMode });
      setAutonomousMode(newMode);
      setNotification({
        type: 'success',
        message: newMode === '2' ? '🚀 Mode 2 (To‘liq Avtopilot) faollashtirildi! AI avtomatik nashr qiladi.' : '🛡 Mode 1 (Yarim-avtomat) tanlandi! Postlar tasdiqlash bilan chiqadi.',
      });
    } catch (e: any) {
      setNotification({ type: 'error', message: 'Rejimni o‘zgartirishda xato yuz berdi' });
    }
  };

  const handleRunAutopilot = async () => {
    setRunningAutopilot(true);
    try {
      const res = await apiClient.post('/scheduler/autopilot/run');
      if (res.data?.success) {
        setNotification({
          type: 'success',
          message: res.data?.mode === '2'
            ? '🚀 [Mode 2: Avtopilot] Yangi post AI tomonidan tayyorlandi va kanalga muvaffaqiyatli nashr qilindi!'
            : '📝 [Mode 1] Yangi post yaratildi va tasdiqlash navbatiga yuborildi!',
        });
      } else {
        setNotification({
          type: 'error',
          message: res.data?.error || 'Avtopilot post chiqara olmadi. Bot @Huquq_study kanalida administrator ekanligini tekshiring!',
        });
      }
      loadData();
    } catch (err: any) {
      setNotification({
        type: 'error',
        message: err.response?.data?.message || 'Avtopilotni ishga tushirishda xatolik yuz berdi',
      });
    } finally {
      setRunningAutopilot(false);
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'overview' || activeTab === 'analytics') {
        const res = await apiClient.get('/analytics/overview').catch(() => null);
        if (res?.data) setStats(res.data);
      }
      if (activeTab === 'approvals') {
        const res = await apiClient.get('/approvals/queue').catch(() => null);
        if (res?.data) setApprovalQueue(res.data);
      }
      if (activeTab === 'news' || activeTab === 'educational' || activeTab === 'cases' || activeTab === 'quizzes') {
        const typeMap: Record<string, string> = {
          news: 'NEWS',
          educational: 'EDUCATIONAL_ARTICLE',
          cases: 'CASE_STUDY',
          quizzes: 'QUIZ',
        };
        const res = await apiClient.get(`/posts?type=${typeMap[activeTab]}`).catch(() => null);
        if (res?.data?.items) setPosts(res.data.items);
      }
      if (activeTab === 'sources') {
        const res = await apiClient.get('/legal-research/sources').catch(() => null);
        if (res?.data) setSources(res.data);
      }
      if (activeTab === 'questions') {
        const res = await apiClient.get('/subscriber-questions').catch(() => null);
        if (res?.data) setQuestions(res.data);
      }
      if (activeTab === 'audit') {
        const res = await apiClient.get('/audit/logs').catch(() => null);
        if (res?.data?.items) setAuditLogs(res.data.items);
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setGenerating(true);
    try {
      let endpoint = '/news/generate';
      let payload: any = { topic: genTopic };

      if (genType === 'educational') {
        endpoint = '/educational-content/generate';
        payload = { topic: genTopic, legalDomain: genDomain };
      } else if (genType === 'case') {
        endpoint = '/case-studies/generate';
        payload = { topic: genTopic, legalDomain: genDomain };
      } else if (genType === 'quiz') {
        endpoint = '/quizzes/generate';
        payload = { topic: genTopic, legalDomain: genDomain };
      }

      await apiClient.post(endpoint, payload);
      setNotification({ type: 'success', message: 'Kontent muvaffaqiyatli generatsiya qilindi va qoralama sifatida saqlandi!' });
      setShowGenerateModal(false);
      setGenTopic('');
      loadData();
    } catch (err: any) {
      setNotification({ type: 'error', message: err.response?.data?.message || 'Generatsiya jarayonida xatolik yuz berdi' });
    } finally {
      setGenerating(false);
    }
  };

  const handleApprove = async (postId: string) => {
    try {
      await apiClient.post(`/approvals/${postId}/approve`, { comments: 'Administrator tomonidan tasdiqlandi' });
      setNotification({ type: 'success', message: 'Post tasdiqlandi!' });
      loadData();
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message });
    }
  };

  const handlePublishNow = async (postId: string) => {
    try {
      await apiClient.post(`/publishing/${postId}/publish-now`);
      setNotification({ type: 'success', message: 'Post @Huquq_study kanaliga muvaffaqiyatli nashr qilindi!' });
      loadData();
    } catch (err: any) {
      setNotification({ type: 'error', message: err.response?.data?.message || 'Nashr qilishda xato' });
    }
  };

  const handleScanLexUz = async () => {
    setLoading(true);
    try {
      const res = await apiClient.post('/legal-research/discover');
      setNotification({ type: 'success', message: `Lex.uz skan qilindi! Yangi hujjatlar: ${res.data?.discovered || 0} ta` });
      loadData();
    } catch (err: any) {
      setNotification({ type: 'error', message: 'Lex.uz ni skan qilishda xato yuz berdi' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 font-sans">
      {/* SIDEBAR */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col border-r border-slate-800">
        <div className="p-6 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <Scale className="w-7 h-7 text-amber-500" />
            <div>
              <h1 className="text-lg font-bold tracking-wider text-white">LEGAL AID AI</h1>
              <p className="text-xs text-slate-400">@Huquq_study Boshqaruvi</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          {[
            { id: 'overview', label: 'Umumiy ko‘rinish', icon: LayoutDashboard },
            { id: 'approvals', label: 'Tasdiqlash navbati', icon: CheckCircle, badge: stats?.totals?.pendingApproval },
            { id: 'news', label: 'Huquqiy yangiliklar', icon: Newspaper },
            { id: 'educational', label: 'Ta\'limiy maqolalar', icon: BookOpen },
            { id: 'cases', label: 'Amaliy kazuslar', icon: Scale },
            { id: 'quizzes', label: 'Test va viktorinalar', icon: HelpCircle },
            { id: 'media', label: 'Media Studio', icon: ImageIcon },
            { id: 'questions', label: 'Obunachilar savollari', icon: MessageSquare, badge: stats?.totals?.questionsCount },
            { id: 'scheduler', label: 'Nashr taqvimi', icon: Clock },
            { id: 'analytics', label: 'Statistika va tahlil', icon: BarChart3 },
            { id: 'sources', label: 'Huquqiy manbalar (Lex.uz)', icon: Search },
            { id: 'settings', label: 'AI va tizim sozlamalari', icon: Settings },
            { id: 'users', label: 'Foydalanuvchilar', icon: Users },
            { id: 'audit', label: 'Audit va xavfsizlik', icon: ShieldAlert },
          ].map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as TabType)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-amber-500 text-slate-950 font-semibold shadow-sm'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </div>
                {item.badge ? (
                  <span className="px-2 py-0.5 text-xs bg-amber-600 text-white rounded-full font-bold">
                    {item.badge}
                  </span>
                ) : null}
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-800 text-xs text-slate-400 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${autonomousMode === '2' ? 'bg-amber-400 animate-ping' : 'bg-blue-400'}`} />
              <span className="font-semibold text-white">Rejim: {autonomousMode === '2' ? 'Mode 2 (Avtopilot)' : 'Mode 1 (Yarim-avtomat)'}</span>
            </div>
          </div>
          <div className="flex space-x-1 pt-1">
            <button
              onClick={() => handleToggleMode('1')}
              className={`flex-1 py-1 rounded text-[11px] font-semibold transition ${
                autonomousMode === '1' ? 'bg-slate-700 text-white' : 'bg-slate-900 text-slate-400 hover:text-white'
              }`}
            >
              Mode 1
            </button>
            <button
              onClick={() => handleToggleMode('2')}
              className={`flex-1 py-1 rounded text-[11px] font-semibold transition ${
                autonomousMode === '2' ? 'bg-amber-500 text-slate-950 font-bold' : 'bg-slate-900 text-slate-400 hover:text-white'
              }`}
            >
              Mode 2 🚀
            </button>
          </div>
          <div className="text-[10px] text-slate-500">Toshkent vaqti: Asia/Tashkent</div>
        </div>
      </aside>

      {/* MAIN WORKSPACE */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* HEADER */}
        <header className="h-16 bg-white border-b border-slate-200 px-8 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h2 className="text-xl font-bold text-slate-900 capitalize">
              {activeTab === 'overview' && 'Boshqaruv paneli'}
              {activeTab === 'approvals' && 'Tasdiqlash navbati (Inson nazorati)'}
              {activeTab === 'news' && 'Qonunchilik yangiliklari'}
              {activeTab === 'educational' && 'Ta\'limiy maqolalar'}
              {activeTab === 'cases' && 'Amaliy huquqiy kazuslar'}
              {activeTab === 'quizzes' && 'Testlar va viktorinalar'}
              {activeTab === 'media' && 'Media Studio va infografika'}
              {activeTab === 'questions' && 'Obunachilar savollari va javoblar'}
              {activeTab === 'scheduler' && 'Telegram kanal nashr taqvimi'}
              {activeTab === 'analytics' && 'Kanal va tizim tahlili'}
              {activeTab === 'sources' && 'Rasmiy qonun manbalari (Lex.uz)'}
              {activeTab === 'settings' && 'AI Provider va parametrlar'}
              {activeTab === 'users' && 'Foydalanuvchilar va ruxsatlar'}
              {activeTab === 'audit' && 'Audit jurnali'}
            </h2>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={handleRunAutopilot}
              disabled={runningAutopilot}
              className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-700 hover:to-amber-600 text-slate-950 font-bold rounded-lg text-sm shadow-sm transition disabled:opacity-50"
              title="AI orqali darhol post yaratish va kanalga chiqarish"
            >
              <Send className={`w-4 h-4 ${runningAutopilot ? 'animate-pulse' : ''}`} />
              <span>{runningAutopilot ? 'Avtopilot ishlamoqda...' : '🚀 Avtopilotni ishga tushirish'}</span>
            </button>

            <button
              onClick={() => {
                setShowGenerateModal(true);
              }}
              className="flex items-center space-x-2 px-4 py-2 bg-slate-900 text-white hover:bg-slate-800 rounded-lg text-sm font-medium transition shadow-sm"
            >
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Yangi AI Kontent</span>
            </button>

            <button
              onClick={loadData}
              className="p-2 border border-slate-200 hover:bg-slate-50 rounded-lg text-slate-600 transition"
              title="Yangilash"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </header>

        {/* NOTIFICATION BANNER */}
        {notification && (
          <div
            className={`px-8 py-3 flex items-center justify-between text-sm ${
              notification.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-b border-emerald-200' : 'bg-rose-50 text-rose-800 border-b border-rose-200'
            }`}
          >
            <span>{notification.message}</span>
            <button onClick={() => setNotification(null)} className="font-bold">✕</button>
          </div>
        )}

        {/* CONTENT AREA */}
        <div className="flex-1 overflow-y-auto p-8 space-y-6">
          {/* TAB: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Stat Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                  <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">Jami postlar</div>
                  <div className="mt-2 text-3xl font-extrabold text-slate-900">{stats?.totals?.totalPosts ?? 0}</div>
                  <div className="mt-1 text-xs text-slate-500">Nashr etilgan: {stats?.totals?.publishedPosts ?? 0}</div>
                </div>

                <div className="bg-white p-6 rounded-xl border border-amber-200 shadow-sm bg-gradient-to-br from-amber-50 to-white">
                  <div className="text-xs font-semibold uppercase tracking-wider text-amber-700">Tasdiqlash kutilmoqda</div>
                  <div className="mt-2 text-3xl font-extrabold text-amber-600">{stats?.totals?.pendingApproval ?? 0}</div>
                  <div className="mt-1 text-xs text-amber-700 font-medium">Inson ruxsatisiz e'lon qilinmaydi</div>
                </div>

                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                  <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">Kanal Obunachilari</div>
                  <div className="mt-2 text-3xl font-extrabold text-slate-900">{stats?.totals?.subscribersCount ?? 0}</div>
                  <div className="mt-1 text-xs text-slate-500">Savollar: {stats?.totals?.questionsCount ?? 0}</div>
                </div>

                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                  <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">AI Samaradorligi</div>
                  <div className="mt-2 text-3xl font-extrabold text-emerald-600">{stats?.aiPerformance?.successRate ?? '100%'}</div>
                  <div className="mt-1 text-xs text-slate-500">Jami so‘rovlar: {stats?.aiPerformance?.total ?? 0}</div>
                </div>
              </div>

              {/* Quick Actions & Recent */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                  <h3 className="text-base font-bold text-slate-900 mb-4">So‘nggi nashrlar (@Huquq_study)</h3>
                  {stats?.recentPublications?.length ? (
                    <div className="divide-y divide-slate-100">
                      {stats.recentPublications.map((pub: any) => (
                        <div key={pub.id} className="py-3 flex items-center justify-between">
                          <div>
                            <div className="font-medium text-slate-900">{pub.post?.title || 'Huquqiy post'}</div>
                            <div className="text-xs text-slate-500">Format: {pub.messageType} • {new Date(pub.publishedAt).toLocaleString('uz-UZ')}</div>
                          </div>
                          <span className="px-2.5 py-1 text-xs font-medium bg-emerald-100 text-emerald-800 rounded-full">
                            Muvaffaqiyatli
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500">Hozircha nashrlar tarixi mavjud emas.</p>
                  )}
                </div>

                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                  <h3 className="text-base font-bold text-slate-900 mb-4">Tezkor amallar</h3>
                  <div className="space-y-3">
                    <button
                      onClick={handleScanLexUz}
                      className="w-full flex items-center justify-between p-3 border border-slate-200 hover:border-amber-500 hover:bg-amber-50 rounded-lg text-sm text-left transition"
                    >
                      <div>
                        <div className="font-semibold text-slate-900">Lex.uz ni skan qilish</div>
                        <div className="text-xs text-slate-500">Yangi qaror va qonunlarni aniqlash</div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </button>

                    <button
                      onClick={() => {
                        setGenType('news');
                        setShowGenerateModal(true);
                      }}
                      className="w-full flex items-center justify-between p-3 border border-slate-200 hover:border-amber-500 hover:bg-amber-50 rounded-lg text-sm text-left transition"
                    >
                      <div>
                        <div className="font-semibold text-slate-900">Yangilik generatsiya qilish</div>
                        <div className="text-xs text-slate-500">AI yangiliklar agenti yordamida</div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </button>

                    <button
                      onClick={() => setActiveTab('approvals')}
                      className="w-full flex items-center justify-between p-3 border border-slate-200 hover:border-amber-500 hover:bg-amber-50 rounded-lg text-sm text-left transition"
                    >
                      <div>
                        <div className="font-semibold text-slate-900">Kutilayotganlarni tasdiqlash</div>
                        <div className="text-xs text-slate-500">{stats?.totals?.pendingApproval || 0} ta post navbatda</div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: APPROVALS */}
          {activeTab === 'approvals' && (
            <div className="space-y-6">
              <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex items-start space-x-3 text-amber-900 text-sm">
                <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold">Yarim-avtonom xavfsizlik nazorati</div>
                  <div>AI tomonidan tayyorlangan qoralamalar faqat inson-administrator tasdiqlagach kanalga chiqishi mumkin. Hech bir post avtomatik e'lon qilinmaydi.</div>
                </div>
              </div>

              {approvalQueue.length === 0 ? (
                <div className="bg-white p-12 text-center rounded-xl border border-slate-200">
                  <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
                  <h3 className="text-lg font-bold text-slate-900">Tasdiqlash navbati bo‘sh</h3>
                  <p className="text-sm text-slate-500 mt-1">Barcha generatsiya qilingan postlar ko‘rib chiqilgan.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-6">
                  {approvalQueue.map((item) => (
                    <div key={item.id} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="px-2.5 py-1 text-xs font-bold bg-slate-900 text-white rounded">
                            {item.type}
                          </span>
                          <span className="px-2.5 py-1 text-xs font-semibold bg-amber-100 text-amber-800 rounded">
                            {item.legalDomain}
                          </span>
                        </div>
                        <span className="text-xs text-slate-500">{new Date(item.createdAt).toLocaleString('uz-UZ')}</span>
                      </div>

                      <h3 className="text-lg font-bold text-slate-900">{item.title}</h3>

                      <div className="bg-slate-50 p-4 rounded-lg font-mono text-sm whitespace-pre-wrap max-h-96 overflow-y-auto border border-slate-200">
                        {item.content}
                      </div>

                      <div className="flex items-center justify-end space-x-3 pt-2">
                        <button
                          onClick={() => handleApprove(item.id)}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold transition shadow-sm"
                        >
                          ✅ Tasdiqlash
                        </button>
                        <button
                          onClick={() => handlePublishNow(item.id)}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition shadow-sm"
                        >
                          🚀 Kanalga darhol chiqarish
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB: CONTENT LIST (NEWS / EDUCATIONAL / CASES / QUIZZES) */}
          {(activeTab === 'news' || activeTab === 'educational' || activeTab === 'cases' || activeTab === 'quizzes') && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="text-sm text-slate-600 font-medium">Jami: {posts.length} ta post</div>
                <button
                  onClick={() => {
                    const map: Record<string, any> = { news: 'news', educational: 'educational', cases: 'case', quizzes: 'quiz' };
                    setGenType(map[activeTab]);
                    setShowGenerateModal(true);
                  }}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold rounded-lg text-sm transition shadow-sm flex items-center space-x-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Yangi generatsiya</span>
                </button>
              </div>

              {posts.length === 0 ? (
                <div className="bg-white p-12 text-center rounded-xl border border-slate-200">
                  <p className="text-slate-500">Hozircha ushbu bo‘limda kontent yo‘q. "Yangi generatsiya" tugmasi orqali yarating.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {posts.map((p) => (
                    <div key={p.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-start justify-between">
                      <div className="space-y-2 max-w-3xl">
                        <div className="flex items-center space-x-2">
                          <span className="px-2 py-0.5 text-xs font-bold bg-slate-100 text-slate-700 rounded">
                            {p.status}
                          </span>
                          <span className="text-xs text-slate-500">{new Date(p.createdAt).toLocaleDateString('uz-UZ')}</span>
                        </div>
                        <h4 className="font-bold text-slate-900 text-base">{p.title}</h4>
                        <p className="text-sm text-slate-600 line-clamp-2">{p.summary || p.content}</p>
                      </div>

                      <div className="flex items-center space-x-2">
                        {p.status === 'APPROVED' && (
                          <button
                            onClick={() => handlePublishNow(p.id)}
                            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm"
                          >
                            Nashr etish
                          </button>
                        )}
                        {p.status === 'PUBLISHED' && (
                          <span className="px-2.5 py-1 text-xs font-bold text-emerald-700 bg-emerald-50 rounded-full">
                            Nashr qilingan
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB: MEDIA STUDIO */}
          {activeTab === 'media' && (
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <h3 className="text-lg font-bold text-slate-900 mb-2">Media Studio — Brend Identifikatsiyasi</h3>
                <p className="text-sm text-slate-600 mb-4">
                  LEGAL AID AI rasmiy vizual uslubi: Dark Navy (#0F172A), Gold (#D97706 / #FBBF24), va White (#FFFFFF).
                </p>

                <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-900 p-8 flex justify-center">
                  <iframe
                    src="/api/v1/media/template/svg?title=Mehnat kodeksidagi yangi kafolatlar&summary=Xodimlarning mehnat huquqlari va dam olish vaqtlari bo‘yicha muhim qonuniy o‘zgarishlar.&domain=MEHNAT HUQUQI"
                    className="w-[600px] h-[337px] border-0 rounded-lg shadow-2xl"
                    title="Brand Preview"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB: SUBSCRIBER QUESTIONS */}
          {activeTab === 'questions' && (
            <div className="space-y-6">
              <h3 className="text-lg font-bold text-slate-900">Telegram Obunachilaridan kelgan savollar</h3>
              {questions.length === 0 ? (
                <div className="bg-white p-12 text-center rounded-xl border border-slate-200">
                  <p className="text-slate-500">Hozircha hech qanday savol kelib tushmagan.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {questions.map((q) => (
                    <div key={q.id} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-3">
                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <span>Foydalanuvchi: @{q.subscriber?.username || q.subscriber?.firstName || 'Anonim'}</span>
                        <span className="font-semibold text-slate-700">{q.responseStatus}</span>
                      </div>
                      <div className="font-bold text-slate-900">"{q.questionText}"</div>
                      {q.aiResponse && (
                        <div className="bg-slate-50 p-4 rounded-lg text-sm text-slate-700 font-mono whitespace-pre-wrap">
                          {q.aiResponse}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB: SOURCES */}
          {activeTab === 'sources' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Huquqiy manbalar reestri</h3>
                  <p className="text-sm text-slate-500">Asosiy manba: Lex.uz - O‘zbekiston Qonunchilik milliy bazasi</p>
                </div>
                <button
                  onClick={handleScanLexUz}
                  className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-semibold hover:bg-slate-800 transition"
                >
                  Lex.uz ni tekshirish
                </button>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {sources.map((s) => (
                  <div key={s.id} className="bg-white p-5 rounded-xl border border-slate-200 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-slate-900 flex items-center space-x-2">
                        <span>{s.name}</span>
                        <span className="px-2 py-0.5 text-xs bg-emerald-100 text-emerald-800 rounded font-semibold">
                          {s.type}
                        </span>
                      </div>
                      <a href={s.baseUrl} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline flex items-center space-x-1 mt-1">
                        <span>{s.baseUrl}</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                    <div className="text-xs text-slate-500 text-right">
                      <div>Hujjatlar: {s._count?.documents || 0}</div>
                      <div>Oxirgi tekshiruv: {s.lastChecked ? new Date(s.lastChecked).toLocaleString('uz-UZ') : 'Hali tekshirilmagan'}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB: SETTINGS */}
          {activeTab === 'settings' && (
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm max-w-2xl space-y-4">
                <h3 className="text-lg font-bold text-slate-900">AI Provayder va Tizim Sozlamalari</h3>
                <p className="text-sm text-slate-500">
                  LEGAL AID AI platformasi Gemini va Claude bilan to‘liq mos keladi.
                </p>

                <div className="space-y-4 pt-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Tanlangan AI Provayder</label>
                    <select
                      defaultValue="gemini"
                      className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    >
                      <option value="gemini">Google Gemini (Tavsiya etiladi)</option>
                      <option value="claude">Anthropic Claude</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">AI Modeli (Model Name)</label>
                    <select
                      defaultValue="gemini-2.0-flash"
                      className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    >
                      <option value="gemini-2.0-flash">gemini-2.0-flash (Tezkor va zamonaviy)</option>
                      <option value="gemini-2.5-flash">gemini-2.5-flash</option>
                      <option value="gemini-1.5-pro">gemini-1.5-pro (Chuqur huquqiy tahlil)</option>
                      <option value="claude-3-5-sonnet-20241022">claude-3-5-sonnet-20241022</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Telegram Kanali</label>
                    <input
                      type="text"
                      readOnly
                      value="@Huquq_study"
                      className="w-full border border-slate-200 bg-slate-50 rounded-lg p-2.5 text-sm text-slate-600 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Vaqt Mintaqasi</label>
                    <input
                      type="text"
                      readOnly
                      value="Asia/Tashkent (O‘zbekiston vaqti)"
                      className="w-full border border-slate-200 bg-slate-50 rounded-lg p-2.5 text-sm text-slate-600"
                    />
                  </div>

                  <div className="pt-2">
                    <button
                      onClick={() => setNotification({ type: 'success', message: 'Sozlamalar saqlandi: Model gemini-2.0-flash faollashtirildi' })}
                      className="px-5 py-2.5 bg-slate-900 text-white rounded-lg text-sm font-semibold hover:bg-slate-800 transition"
                    >
                      Saqlash
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: AUDIT */}
          {activeTab === 'audit' && (
            <div className="space-y-6">
              <h3 className="text-lg font-bold text-slate-900">Tizim va xavfsizlik audit jurnali</h3>
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase">
                    <tr>
                      <th className="px-6 py-3">Vaqt</th>
                      <th className="px-6 py-3">Harakat</th>
                      <th className="px-6 py-3">Ob'ekt</th>
                      <th className="px-6 py-3">Foydalanuvchi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {auditLogs.map((log) => (
                      <tr key={log.id}>
                        <td className="px-6 py-4 text-xs text-slate-500">{new Date(log.createdAt).toLocaleString('uz-UZ')}</td>
                        <td className="px-6 py-4 font-semibold text-slate-900">{log.action}</td>
                        <td className="px-6 py-4 text-xs font-mono">{log.entityType} ({log.entityId?.slice(0, 8)})</td>
                        <td className="px-6 py-4 text-slate-600">{log.user?.fullName || 'Tizim'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* GENERATE MODAL */}
      {showGenerateModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Yangi AI Huquqiy Kontent Yaratish</h3>

            <form onSubmit={handleGenerate} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Kontent Turi</label>
                <select
                  value={genType}
                  onChange={(e) => setGenType(e.target.value as any)}
                  className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                >
                  <option value="news">Huquqiy Yangilik (News Agent)</option>
                  <option value="educational">Ta'limiy Maqola (Education Agent)</option>
                  <option value="case">Amaliy Kazus (Case Study Agent)</option>
                  <option value="quiz">Test / Viktorina (Quiz Agent)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Huquqiy Soha</label>
                <select
                  value={genDomain}
                  onChange={(e) => setGenDomain(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                >
                  <option value="CIVIL">Fuqarolik huquqi</option>
                  <option value="LABOR">Mehnat huquqi</option>
                  <option value="FAMILY">Oila huquqi</option>
                  <option value="CRIMINAL">Jinoyat huquqi</option>
                  <option value="ADMINISTRATIVE">Ma'muriy huquq</option>
                  <option value="CONSTITUTIONAL">Konstitutsiyaviy huquq</option>
                  <option value="TAX">Soliq huquqi</option>
                  <option value="BUSINESS">Biznes va tadbirkorlik</option>
                  <option value="HUMAN_RIGHTS">Inson huquqlari</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Mavzu yoki Qonun Hujjati</label>
                <textarea
                  required
                  rows={3}
                  value={genTopic}
                  onChange={(e) => setGenTopic(e.target.value)}
                  placeholder="Masalan: Mehnat shartnomasini bekor qilish tartibi va xodimning huquqlari..."
                  className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowGenerateModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg text-sm hover:bg-slate-50"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={generating}
                  className="px-5 py-2 bg-slate-900 text-white rounded-lg text-sm font-semibold hover:bg-slate-800 disabled:opacity-50 flex items-center space-x-2"
                >
                  {generating ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-amber-400" />
                      <span>AI Generatsiya qilmoqda...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-amber-400" />
                      <span>Generatsiya qilish</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
