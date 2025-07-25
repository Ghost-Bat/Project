README.md :
GhostBat
GhostBat, gizlilik ve güvenliği ön planda tutan, modern, sunucusuz ve tamamen eşten eşe (P2P) çalışan bir iletişim platformudur. Amacı, merkezi sunuculara olan ihtiyacı ortadan kaldırarak kullanıcıların verileri üzerindeki kontrolünü onlara geri vermektir.
Tamamen Açık Kaynak Kodlu: (GPL v2 altında lisanslanmıştır)
Eşten Eşe (Peer-to-peer): İletişim, merkezi bir sunucuya uğramadan doğrudan sizinle karşıdaki kişi arasında gerçekleşir.
Uçtan Uca Şifreli: WebRTC standardı (DTLS-SRTP) ile tüm veri akışı (video, ses, dosyalar) doğası gereği şifrelidir.
Geçici (Ephemeral): Mesajlar ve paylaşılan dosyalar hiçbir sunucuda veya cihazda kalıcı olarak saklanmaz. Oturum kapandığında tüm veriler bellekten silinir.
Merkeziyetsiz: Çalışmak için geleneksel bir backend sunucusuna ihtiyaç duymaz.
Kendi Sunucunda Barındırılabilir (Self-hostable): Projeyi kendi alan adınızda kolayca yayınlayabilirsiniz.
Nasıl Çalışır? (Teknik Detaylar)
GhostBat, geleneksel "istemci-sunucu" modelinden farklı bir mimari kullanır. Tüm "sihir", kullanıcıların tarayıcılarında gerçekleşir.
1. Başlangıç ve Bağlantı Kurma (Signaling)
Kullanıcıların birbirini bulabilmesi için bir "tanışma" mekanizması gereklidir. GhostBat bu süreci Trystero kütüphanesi ve WebTorrent protokolü aracılığıyla çözer.
WebTorrent Trackers: Kullanıcılar aynı "oda"ya (bir nevi kanala) katıldığında, genel WebTorrent sunucuları aracılığıyla birbirlerinin varlığından haberdar olurlar. Bu sunucular sohbet içeriğini asla görmez, sadece "bu odada kimler var?" sorusuna cevap verir.
STUN Sunucuları: Kullanıcılar birbirini bulduktan sonra, WebRTC bağlantısı kurmak için genel STUN sunucuları kullanılır. Bu sunucular, her kullanıcının genel IP adresini (ev adresi gibi) öğrenmesine yardımcı olur.
TURN Sunucuları (Yedek Plan): Eğer iki kullanıcı da karmaşık güvenlik duvarları (firewall) arkasındaysa ve doğrudan bağlantı kuramazsa, iletişim bir TURN sunucusu üzerinden aktarılır (relay). Bu, bağlantının her koşulda kurulmasını garanti eder. GhostBat, bu TURN sunucu bilgilerini güvenli bir şekilde sağlamak için isteğe bağlı bir sunucusuz API (/api/get-config) kullanır.
2. Eşten Eşe (Peer-to-Peer) İletişim
Bağlantı kurulduktan sonra, tüm veri akışı (mesajlar, video, ses, dosyalar) WebRTC RTCDataChannel ve MediaStream API'ları kullanılarak doğrudan kullanıcıların tarayıcıları arasında gerçekleşir. Verileriniz rusakh.online sunucularına asla uğramaz.
3. Güvenlik ve Şifreleme
GhostBat'in güvenliği iki katmanlıdır:
Aktarım Katmanı Şifrelemesi: Tüm WebRTC bağlantıları, DTLS-SRTP protokolleri ile zorunlu olarak şifrelenir. Bu, verilerin bir noktadan diğerine giderken okunmasını engeller.
Eş Doğrulama (Peer Verification): Bir odaya yeni biri katıldığında, GhostBat ek bir güvenlik katmanı olarak açık anahtarlı şifreleme kullanır. Her kullanıcının tarayıcısında bir genel/özel anahtar çifti oluşturulur. Eşler, birbirlerinin kimliğini bu anahtarlar aracılığıyla kriptografik olarak doğrular. Bu, "ortadaki adam" (man-in-the-middle) saldırılarına karşı bir güvence sağlar. Özel anahtarınız cihazınızdan asla ayrılmaz.
4. Dosya Paylaşımı
Dosya paylaşımı, secure-file-transfer kütüphanesi kullanılarak yine tamamen P2P olarak gerçekleştirilir. Bir dosya gönderdiğinizde:
Dosya tarayıcınızda parçalara (chunks) ayrılır.
Her bir parça, oda adı kullanılarak oluşturulan bir anahtarla şifrelenir.
Şifrelenmiş parçalar alıcının tarayıcısına doğrudan gönderilir.
Alıcının tarayıcısı parçaları birleştirir ve şifresini çözer.
Bu yöntemle, dosya boyutu limiti yoktur ve dosyalarınız asla bir sunucuya yüklenmez.
Teknoloji Mimarisi
Frontend: React, TypeScript, Vite
UI Kütüphanesi: Material UI (MUI)
P2P & WebRTC Yönetimi: Trystero
Dosya Transferi: secure-file-transfer
Yerel Depolama: localforage (kullanıcı ayarları için)
Sunucusuz API: Cloudflare Functions / Vercel Functions (Node.js)
Kendi Sunucunda Barındırma (Self-Hosting)
Bu projeyi kendi alan adınızda (örneğin Cloudflare Pages'de) barındırmak için aşağıdaki adımları izleyin.
Ön Koşullar
Kodları https://github.com/Ghost-Bat/Project adresinden kendi GitHub hesabınıza fork'layın veya klonlayın.
npm ve Node.js (versiyon 20.12.1 veya üstü) yüklü olmalı.
Cloudflare hesabınız olmalı ve alan adınız (rusakh.online) Cloudflare'e yönlendirilmiş olmalı.
Kurulum Adımları
Proje Kimliğini Güncelleyin (package.json):
Generated json
{
  "name": "ghostbat",
  "homepage": "https://rusakh.online/",
  ...
}
Json
Alan Adını Ayarlayın (public/CNAME):
Dosyanın içeriğini rusakh.online olarak değiştirin.
Cloudflare Pages Projesi Oluşturun:
Cloudflare panelinde Workers & Pages > Create application > Pages > Connect to Git adımlarını izleyin.
GitHub deponuzu seçin.
Build settings kısmını aşağıdaki gibi yapılandırın:
Framework preset: Vite
Build command: npm run build
Build output directory: dist
Ortam Değişkenlerini (Environment Variables) Ayarlayın:
Bu, projenin tüm özellikleriyle çalışması için kritik bir adımdır. Cloudflare Pages projenizin Settings > Environment variables bölümüne aşağıdaki değişkenleri ekleyin:
VITE_RTC_CONFIG_ENDPOINT: Değeri /api/get-config olmalı.
VITE_STUN_SERVERS: Değeri stun:stun.l.google.com:19302,stun:stun1.l.google.com:19302 olmalı.
RTC_CONFIG:
Cloudflare panelinde alan adınız için Network > TURN menüsünden size özel TURN bilgilerinizi (URL, Username, Credential) alın.
Bilgisayarınızda proje klasöründe npm run generate-rtc-config komutunu çalıştırın.
Komutun sorduğu yerlere Cloudflare'den aldığınız TURN bilgilerinizi girin.
Komutun sonunda size vereceği Base64 metnini kopyalayın ve bu değişkenin değeri olarak yapıştırın.
Dağıtın ve Alan Adınızı Bağlayın:
Save and Deploy'a tıklayın.
Dağıtım tamamlandıktan sonra, Custom domains sekmesinden rusakh.online alan adınızı projeye bağlayın.
Lisans
Bu proje GNU General Public License v2 (GPLv2) altında lisanslanmıştır. Bu, projeyi özgürce kullanabileceğiniz, değiştirebileceğiniz ve dağıtabileceğiniz anlamına gelir. Ancak, bu projeden türettiğiniz herhangi bir çalışmayı dağıtırsanız, onu da aynı şekilde GPL v2 lisansı altında ve kaynak kodlarıyla birlikte yayınlamak zorundasınız.
Bu proje, Jeremy Kahn tarafından oluşturulan orijinal açık kaynaklı proje olan Chitchatter'ın bir fork'udur.
Sorumluluk Reddi Beyanı
GhostBat'i kullanarak, kullanımıyla ilgili eylemleriniz için tüm sorumluluğu kabul etmiş olursunuz. Ek olarak, GhostBat projesine katkıda bulunanları, kullanımınızın herhangi bir sonucundan sorumlu tutmayacağınızı kabul edersiniz. GhostBat geliştiricileri yasadışı faaliyetleri desteklemez.
