GhostBat: Güvenli, Sunucusuz ve Merkeziyetsiz İletişim Platformu
GhostBat, gizlilik ve güvenliği en üst düzeyde tutan, modern, sunucusuz ve tamamen eşten eşe (P2P) çalışan bir iletişim platformudur. Temel amacı, kullanıcıların verileri üzerindeki kontrolü tamamen onlara geri vererek merkezi sunuculara olan bağımlılığı ortadan kaldırmaktır.
Felsefe ve Temel Özellikler
Tamamen Açık Kaynak Kodlu: Proje, GNU General Public License v2 (GPLv2) altında lisanslanmıştır.[1][2][3] Bu, kodu özgürce inceleyebileceğiniz, değiştirebileceğiniz ve dağıtabileceğiniz anlamına gelir.[1] Yaptığınız değişiklikleri de aynı lisansla yayınlamanız gerekir.[2][3]
Eşten Eşe (Peer-to-Peer): İletişiminiz, araya merkezi bir sunucu girmeden, doğrudan sizin ve konuştuğunuz kişinin cihazları arasında gerçekleşir.[4][5]
Uçtan Uca Şifreli: Tüm video, ses, dosya ve mesajlaşma trafiği, WebRTC standardı olan DTLS-SRTP protokolü ile varsayılan olarak şifrelenir.[6][7][8][9][10] Bu, verilerinizin aktarım sırasında üçüncü şahıslar tarafından okunmasını engeller.
Geçici (Ephemeral): Mesajlar ve paylaşılan dosyalar hiçbir sunucuda veya cihazda kalıcı olarak saklanmaz. Oturum kapatıldığında tüm veriler bellekten silinir. Bu, dijital ayak izinizi en aza indirir.
Merkeziyetsiz: GhostBat, çalışmak için geleneksel bir backend sunucusuna ihtiyaç duymaz. Bu, tek bir hata noktasının (single point of failure) olmamasını ve sansüre karşı daha dayanıklı olmasını sağlar.
Kendi Sunucunda Barındırılabilir (Self-hostable): Projeyi kolayca kendi alan adınızda, örneğin Cloudflare Pages gibi platformlarda barındırabilirsiniz.[11][12][13][14][15]
Nasıl Çalışır? (Teknik Detaylar)
GhostBat, geleneksel "istemci-sunucu" modelinden radikal bir şekilde ayrılarak, tüm iletişimi kullanıcıların tarayıcılarında gerçekleştirir.
1. Başlangıç ve Bağlantı Kurma (Signaling)
Kullanıcıların birbirini bulabilmesi için bir "tanışma" mekanizmasına ihtiyaç vardır. GhostBat, bu kritik süreci Trystero kütüphanesi ve WebTorrent protokolü aracılığıyla akıllıca çözer.
WebTorrent Trackers: Kullanıcılar aynı "oda"ya katıldığında, halka açık WebTorrent sunucuları aracılığıyla birbirlerinin varlığından haberdar olurlar.[4][5][16][17][18] Bu sunucular, sohbet içeriğini veya kimliğinizi asla görmezler; sadece "bu odada kimler var?" sorusuna yanıt vererek eşlerin birbirini bulmasını sağlarlar.
STUN Sunucuları: Eşler birbirini bulduktan sonra, doğrudan bir WebRTC bağlantısı kurabilmek için genel STUN sunucuları kullanılır. Bu sunucular, her bir kullanıcının güvenlik duvarı (firewall) arkasındaki genel IP adresini öğrenmesine yardımcı olur.
TURN Sunucuları (Gelişmiş Bağlantı): Eğer her iki kullanıcı da karmaşık ağ yapıları veya güvenlik duvarları arkasındaysa ve doğrudan bağlantı kuramazsa, iletişim bir TURN sunucusu üzerinden aktarılır (relay). Bu, her koşulda bağlantının kurulmasını garanti altına alır. GhostBat, bu TURN sunucu bilgilerini güvenli bir şekilde sağlamak için isteğe bağlı olarak sunucusuz bir API (/api/get-config) kullanır. Bu özellik "Gelişmiş Bağlantı" (Enhanced Connectivity) olarak adlandırılır ve kullanıcı tarafından devre dışı bırakılabilir.
2. Eşten Eşe (Peer-to-Peer) İletişim
Bağlantı başarıyla kurulduktan sonra, tüm veri akışı (mesajlar, video, ses, dosyalar) WebRTC RTCDataChannel ve MediaStream API'ları kullanılarak doğrudan kullanıcıların tarayıcıları arasında gerçekleşir. Verileriniz, projenin barındırıldığı sunuculara dahi asla uğramaz.
3. Güvenlik ve Şifreleme
GhostBat'in güvenliği iki temel katmandan oluşur:
Aktarım Katmanı Şifrelemesi: WebRTC standardı gereği, tüm veri akışı DTLS-SRTP protokolleri ile zorunlu olarak şifrelenir.[6][7][8] Bu, verilerin bir noktadan diğerine giderken okunmasını veya değiştirilmesini engeller.
Eş Doğrulama (Peer Verification): Bir odaya yeni bir eş katıldığında, GhostBat ek bir güvenlik katmanı olarak açık anahtarlı şifreleme kullanır. Her kullanıcının tarayıcısında bir genel/özel anahtar çifti (RSA-OAEP) oluşturulur. Eşler, birbirlerinin kimliğini bu anahtarlar aracılığıyla kriptografik olarak doğrular. Bu, "ortadaki adam" (man-in-the-middle) saldırılarına karşı güçlü bir güvence sağlar. Özel anahtarınız cihazınızdan asla ayrılmaz.
4. Dosya Paylaşımı
Dosya paylaşımı, secure-file-transfer kütüphanesi kullanılarak yine tamamen P2P olarak, güvenli bir şekilde gerçekleştirilir.[19] Bir dosya gönderdiğinizde:
Dosya, tarayıcınızda parçalara (chunks) ayrılır.
Her bir parça, oda adı kullanılarak oluşturulan bir anahtarla şifrelenir.
Şifrelenmiş parçalar alıcının tarayıcısına doğrudan gönderilir.
Alıcının tarayıcısı parçaları birleştirir, şifresini çözer ve dosyayı kaydetmenizi sağlar.
Bu yöntem sayesinde, dosya boyutu limiti yoktur ve dosyalarınız asla bir sunucuya yüklenmez.
Teknoloji Mimarisi
Frontend: React, TypeScript, Vite[20][21][22][23][24]
UI Kütüphanesi: Material UI (MUI)[25][26][27][28][29]
P2P & WebRTC Yönetimi: Trystero[30][31][32][33][34]
Dosya Transferi: secure-file-transfer
Yerel Depolama: localforage (kullanıcı ayarları için)
Sunucusuz API: Cloudflare Functions / Vercel Functions (Node.js)[35][36][37][38][39]
Kendi Sunucunda Barındırma (Self-Hosting)
Bu projeyi kendi alan adınızda (örneğin Cloudflare Pages'de) barındırmak için aşağıdaki adımları izleyin.[11][12][13][14][15]
Ön Koşullar
Kodları https://github.com/Ghost-Bat/Project adresinden kendi GitHub hesabınıza fork'layın veya klonlayın.
npm ve Node.js (versiyon 20.12.1 veya üstü) yüklü olmalı.
Bir Cloudflare hesabınız ve alan adınız (örneğin rusakh.online) Cloudflare'e yönlendirilmiş olmalı.
Kurulum Adımları
Proje Kimliğini Güncelleyin (package.json):
Generated json
{
  "name": "ghostbat",
  "homepage": "https://alan-adiniz.com/",
  ...
}
Use code with caution.
Json
Alan Adını Ayarlayın (public/CNAME):
Dosyanın içeriğini kendi alan adınızla (alan-adiniz.com) değiştirin.
Cloudflare Pages Projesi Oluşturun:
Cloudflare panelinde Workers & Pages > Create application > Pages > Connect to Git adımlarını izleyin.
GitHub deponuzu seçin.
Build settings kısmını aşağıdaki gibi yapılandırın:
Framework preset: Vite
Build command: npm run build
Build output directory: dist
Ortam Değişkenlerini (Environment Variables) Ayarlayın:
Bu, projenin tüm özellikleriyle çalışması için kritik bir adımdır. Cloudflare Pages projenizin Settings > Environment variables bölümüne aşağıdaki değişkenleri ekleyin:
VITE_RTC_CONFIG_ENDPOINT: Değeri /api/get-config olmalı. Bu, "Gelişmiş Bağlantı" özelliği için TURN sunucu bilgilerini çekecek olan sunucusuz API'nin yoludur.
VITE_STUN_SERVERS: Değeri stun:stun.l.google.com:19302,stun:stun1.l.google.com:19302 olmalı. Bu, eşlerin birbirini bulmasına yardımcı olan genel STUN sunucularıdır.
RTC_CONFIG:
Cloudflare panelinde alan adınız için Network > TURN menüsünden size özel TURN bilgilerinizi (URL, Username, Credential) alın.
Bilgisayarınızda proje klasöründe npm run generate-rtc-config komutunu çalıştırın.
Komutun sorduğu yerlere Cloudflare'den aldığınız TURN bilgilerinizi girin.
Komutun sonunda size vereceği Base64 metnini kopyalayın ve bu değişkenin değeri olarak yapıştırın.
Dağıtın ve Alan Adınızı Bağlayın:
Save and Deploy'a tıklayın.
Dağıtım tamamlandıktan sonra, Custom domains sekmesinden kendi alan adınızı (alan-adiniz.com) projeye bağlayın.
Lisans
Bu proje GNU General Public License v2 (GPLv2) altında lisanslanmıştır.[1][2][3][40][41] Bu, projeyi özgürce kullanabileceğiniz, değiştirebileceğiniz ve dağıtabileceğiniz anlamına gelir. Ancak, bu projeden türettiğiniz herhangi bir çalışmayı dağıtırsanız, onu da aynı şekilde GPL v2 lisansı altında ve kaynak kodlarıyla birlikte yayınlamak zorundasınız.[1][2]
Bu proje, Jeremy Kahn tarafından oluşturulan orijinal açık kaynaklı proje olan Chitchatter'ın bir fork'udur.
Sorumluluk Reddi Beyanı
GhostBat'i kullanarak, kullanımıyla ilgili eylemleriniz için tüm sorumluluğu kabul etmiş olursunuz. Ek olarak, GhostBat projesine katkıda bulunanları, kullanımınızın herhangi bir sonucundan sorumlu tutmayacağınızı kabul edersiniz. GhostBat geliştiricileri yasadışı faaliyetleri desteklemez.
