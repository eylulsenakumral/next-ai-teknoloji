import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import pg from "pg"

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL ?? "postgresql://postgres:postgres@localhost:5432/nextai",
})
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

interface ProvinceDistrict {
  id: number
  name: string
}

interface Province {
  id: number
  name: string
  districts: ProvinceDistrict[]
}

async function main() {
  // API'den Turkiye il/ilce verisini cek
  let provinces: Province[]

  try {
    const response = await fetch("https://turkiye-api-eight.vercel.app/api/v1/provinces")
    if (!response.ok) {
      throw new Error(`API response: ${response.status}`)
    }
    const json = await response.json()
    provinces = json.data ?? json
  } catch (err) {
    console.error("API'den veri cekilemedi, hardcoded veri kullanilacak:", err)
    // Fallback: minimum veri
    provinces = getHardcodedProvinces()
  }

  console.log(`${provinces.length} il bulundu, veritabanina ekleniyor...`)

  let totalDistricts = 0

  for (const province of provinces) {
    // City upsert (idempotent)
    await prisma.city.upsert({
      where: { id: province.id },
      update: { name: province.name, plateCode: province.id },
      create: {
        id: province.id,
        name: province.name,
        plateCode: province.id,
      },
    })

    // District'leri ekle
    for (const district of province.districts) {
      await prisma.district.upsert({
        where: {
          cityId_name: {
            cityId: province.id,
            name: district.name,
          },
        },
        update: {},
        create: {
          name: district.name,
          cityId: province.id,
        },
      })
      totalDistricts++
    }
  }

  console.log(`Tamamlandi: ${provinces.length} il, ${totalDistricts} ilce eklendi.`)
  await prisma.$disconnect()
  await pool.end()
}

function getHardcodedProvinces(): Province[] {
  // Turkiye 81 il ve ilceleri (kisaltilmis - onemli iller)
  return [
    { id: 1, name: "Adana", districts: [{ id: 1, name: "Seyhan" }, { id: 2, name: "Cukurova" }, { id: 3, name: "Yuregir" }, { id: 4, name: "Saricam" }, { id: 5, name: "Karaisali" }, { id: 6, name: "Pozanti" }, { id: 7, name: "Aladag" }, { id: 8, name: "Ceyhan" }, { id: 9, name: "Feke" }, { id: 10, name: "Imamoglu" }, { id: 11, name: "Karatas" }, { id: 12, name: "Kozan" }, { id: 13, name: "Saimbeyli" }, { id: 14, name: "Tufanbeyli" }, { id: 15, name: "Yumurtalik" }] },
    { id: 2, name: "Adiyaman", districts: [{ id: 1, name: "Merkez" }, { id: 2, name: "Besni" }, { id: 3, name: "Celikhan" }, { id: 4, name: "Gerger" }, { id: 5, name: "Golbasi" }, { id: 6, name: "Kahta" }, { id: 7, name: "Samsat" }, { id: 8, name: "Sincik" }, { id: 9, name: "Tut" }] },
    { id: 3, name: "Afyonkarahisar", districts: [{ id: 1, name: "Merkez" }, { id: 2, name: "Basmakci" }, { id: 3, name: "Bayat" }, { id: 4, name: "Bolvadin" }, { id: 5, name: "Cay" }, { id: 6, name: "Cobanlar" }, { id: 7, name: "Dazkiri" }, { id: 8, name: "Dinar" }, { id: 9, name: "Emirdag" }, { id: 10, name: "Evciler" }, { id: 11, name: "Hocalar" }, { id: 12, name: "Ihsaniye" }, { id: 13, name: "Iscehisar" }, { id: 14, name: "Kiziloren" }, { id: 15, name: "Sandikli" }, { id: 16, name: "Sinanpasa" }, { id: 17, name: "Sultandagi" }, { id: 18, name: "Suhut" }] },
    { id: 4, name: "Agri", districts: [{ id: 1, name: "Merkez" }, { id: 2, name: "Diyadin" }, { id: 3, name: "Dogubayazit" }, { id: 4, name: "Eleskirt" }, { id: 5, name: "Hamur" }, { id: 6, name: "Patnos" }, { id: 7, name: "Taslicay" }, { id: 8, name: "Tutak" }] },
    { id: 5, name: "Amasya", districts: [{ id: 1, name: "Merkez" }, { id: 2, name: "Goynucek" }, { id: 3, name: "Gumushacikoy" }, { id: 4, name: "Hamamozu" }, { id: 5, name: "Merzifon" }, { id: 6, name: "Suluova" }, { id: 7, name: "Tasova" }] },
    { id: 6, name: "Ankara", districts: [{ id: 1, name: "Altindag" }, { id: 2, name: "Cankaya" }, { id: 3, name: "Etimesgut" }, { id: 4, name: "Kecioren" }, { id: 5, name: "Mamak" }, { id: 6, name: "Sincan" }, { id: 7, name: "Yenimahalle" }, { id: 8, name: "Pursaklar" }, { id: 9, name: "Golbasi" }, { id: 10, name: "Akyurt" }, { id: 11, name: "Ayas" }, { id: 12, name: "Bala" }, { id: 13, name: "Beypazari" }, { id: 14, name: "Camlidere" }, { id: 15, name: "Cubuk" }, { id: 16, name: "Elmadag" }, { id: 17, name: "Evren" }, { id: 18, name: "Gudul" }, { id: 19, name: "Haymana" }, { id: 20, name: "Kalecik" }, { id: 21, name: "Kazan" }, { id: 22, name: "Kizilcahamam" }, { id: 23, name: "Nallihan" }, { id: 24, name: "Polatli" }, { id: 25, name: "Sereflikochisar" }] },
    { id: 7, name: "Antalya", districts: [{ id: 1, name: "Muratpasa" }, { id: 2, name: "Konyaalti" }, { id: 3, name: "Kepez" }, { id: 4, name: "Aksu" }, { id: 5, name: "Dosemealty" }, { id: 6, name: "Alanya" }, { id: 7, name: "Akseki" }, { id: 8, name: "Demre" }, { id: 9, name: "Elmali" }, { id: 10, name: "Finike" }, { id: 11, name: "Gazipasa" }, { id: 12, name: "Gundogmus" }, { id: 13, name: "Ibradi" }, { id: 14, name: "Kas" }, { id: 15, name: "Kemer" }, { id: 16, name: "Koprulu" }, { id: 17, name: "Korkuteli" }, { id: 18, name: "Kumluca" }, { id: 19, name: "Manavgat" }, { id: 20, name: "Serik" }] },
    { id: 8, name: "Artvin", districts: [{ id: 1, name: "Merkez" }, { id: 2, name: "Ardanuc" }, { id: 3, name: "Arhavi" }, { id: 4, name: "Borcka" }, { id: 5, name: "Hopa" }, { id: 6, name: "Murgul" }, { id: 7, name: "Savsat" }, { id: 8, name: "Yusufeli" }] },
    { id: 9, name: "Aydin", districts: [{ id: 1, name: "Efeler" }, { id: 2, name: "Bozdogan" }, { id: 3, name: "Buharkent" }, { id: 4, name: "Cine" }, { id: 5, name: "Didim" }, { id: 6, name: "Germencik" }, { id: 7, name: "Incirliova" }, { id: 8, name: "Karacasu" }, { id: 9, name: "Karpuzlu" }, { id: 10, name: "Kocarli" }, { id: 11, name: "Kosk" }, { id: 12, name: "Kusadasi" }, { id: 13, name: "Kuyucak" }, { id: 14, name: "Nazilli" }, { id: 15, name: "Soke" }, { id: 16, name: "Sultanhisar" }, { id: 17, name: "Yenipazar" }] },
    { id: 10, name: "Balikesir", districts: [{ id: 1, name: "Altieylul" }, { id: 2, name: "Karesi" }, { id: 3, name: "Ayvalik" }, { id: 4, name: "Balya" }, { id: 5, name: "Bandirma" }, { id: 6, name: "Bigadic" }, { id: 7, name: "Burhaniye" }, { id: 8, name: "Dursunbey" }, { id: 9, name: "Edremit" }, { id: 10, name: "Erdek" }, { id: 11, name: "Gomec" }, { id: 12, name: "Gonen" }, { id: 13, name: "Havran" }, { id: 14, name: "Ivrindy" }, { id: 15, name: "Kepsut" }, { id: 16, name: "Manyas" }, { id: 17, name: "Marmara" }, { id: 18, name: "Savastepe" }, { id: 19, name: "Sindirgi" }, { id: 20, name: "Susurluk" }] },
    { id: 11, name: "Bilecik", districts: [{ id: 1, name: "Merkez" }, { id: 2, name: "Bozuyuk" }, { id: 3, name: "Golpazari" }, { id: 4, name: "Inhisar" }, { id: 5, name: "Osmaneli" }, { id: 6, name: "Pazaryeri" }, { id: 7, name: "Sogut" }, { id: 8, name: "Yenipazar" }] },
    { id: 12, name: "Bingol", districts: [{ id: 1, name: "Merkez" }, { id: 2, name: "Adakli" }, { id: 3, name: "Genc" }, { id: 4, name: "Karliova" }, { id: 5, name: "Kigi" }, { id: 6, name: "Solhan" }, { id: 7, name: "Yayladere" }, { id: 8, name: "Yedisu" }] },
    { id: 13, name: "Bitlis", districts: [{ id: 1, name: "Merkez" }, { id: 2, name: "Adilcevaz" }, { id: 3, name: "Ahlat" }, { id: 4, name: "Guroymak" }, { id: 5, name: "Hizan" }, { id: 6, name: "Mutki" }, { id: 7, name: "Tatvan" }] },
    { id: 14, name: "Bolu", districts: [{ id: 1, name: "Merkez" }, { id: 2, name: "Dortdivan" }, { id: 3, name: "Gerede" }, { id: 4, name: "Goynuk" }, { id: 5, name: "Kibriscik" }, { id: 6, name: "Mengen" }, { id: 7, name: "Mudurnu" }, { id: 8, name: "Seben" }, { id: 9, name: "Yenicaga" }] },
    { id: 15, name: "Burdur", districts: [{ id: 1, name: "Merkez" }, { id: 2, name: "Aglasun" }, { id: 3, name: "Altinyayla" }, { id: 4, name: "Bucak" }, { id: 5, name: "Cavdir" }, { id: 6, name: "Celtikci" }, { id: 7, name: "Golhisar" }, { id: 8, name: "Karamanli" }, { id: 9, name: "Kemer" }, { id: 10, name: "Tefenni" }, { id: 11, name: "Yesilova" }] },
    { id: 16, name: "Bursa", districts: [{ id: 1, name: "Osmangazi" }, { id: 2, name: "Nilufer" }, { id: 3, name: "Yildirim" }, { id: 4, name: "Gursu" }, { id: 5, name: "Kestel" }, { id: 6, name: "Buyukorhan" }, { id: 7, name: "Gemlik" }, { id: 8, name: "Harmancik" }, { id: 9, name: "Inegol" }, { id: 10, name: "Iznik" }, { id: 11, name: "Karacabey" }, { id: 12, name: "Keles" }, { id: 13, name: "Mudanya" }, { id: 14, name: "Mustafakemalpasa" }, { id: 15, name: "Orhaneli" }, { id: 16, name: "Orhangazi" }, { id: 17, name: "Yenisehir" }] },
    { id: 17, name: "Canakkale", districts: [{ id: 1, name: "Merkez" }, { id: 2, name: "Ayvacik" }, { id: 3, name: "Bayramicc" }, { id: 4, name: "Biga" }, { id: 5, name: "Bozcaada" }, { id: 6, name: "Can" }, { id: 7, name: "Eceabat" }, { id: 8, name: "Ezine" }, { id: 9, name: "Gelibolu" }, { id: 10, name: "Gokceada" }, { id: 11, name: "Lapseki" }, { id: 12, name: "Yenice" }] },
    { id: 18, name: "Cankiri", districts: [{ id: 1, name: "Merkez" }, { id: 2, name: "Atkaracalar" }, { id: 3, name: "Bayramoren" }, { id: 4, name: "Cerkes" }, { id: 5, name: "Eldivan" }, { id: 6, name: "Ilgaz" }, { id: 7, name: "Kizilirmak" }, { id: 8, name: "Korgun" }, { id: 9, name: "Kurskale" }, { id: 10, name: "Orta" }, { id: 11, name: "Sabanozu" }, { id: 12, name: "Yaprakli" }] },
    { id: 19, name: "Corum", districts: [{ id: 1, name: "Merkez" }, { id: 2, name: "Alaca" }, { id: 3, name: "Bayat" }, { id: 4, name: "Bogazkale" }, { id: 5, name: "Dodurga" }, { id: 6, name: "Iskilip" }, { id: 7, name: "Kargi" }, { id: 8, name: "Lacin" }, { id: 9, name: "Mecitozu" }, { id: 10, name: "Oguzlar" }, { id: 11, name: "Ortakoy" }, { id: 12, name: "Osmancik" }, { id: 13, name: "Sungurlu" }, { id: 14, name: "Ugurludag" }] },
    { id: 20, name: "Denizli", districts: [{ id: 1, name: "Merkezefendi" }, { id: 2, name: "Pamukkale" }, { id: 3, name: "Acipayam" }, { id: 4, name: "Babadagi" }, { id: 5, name: "Baklan" }, { id: 6, name: "Bekilli" }, { id: 7, name: "Beyagac" }, { id: 8, name: "Bozkurt" }, { id: 9, name: "Buldan" }, { id: 10, name: "Cal" }, { id: 11, name: "Cameli" }, { id: 12, name: "Cardak" }, { id: 13, name: "Civril" }, { id: 14, name: "Guney" }, { id: 15, name: "Honaz" }, { id: 16, name: "Kale" }, { id: 17, name: "Saraykoy" }, { id: 18, name: "Serinhisar" }, { id: 19, name: "Tavas" }] },
    { id: 21, name: "Diyarbakir", districts: [{ id: 1, name: "Baglar" }, { id: 2, name: "Kayapinar" }, { id: 3, name: "Sur" }, { id: 4, name: "Yenisehir" }, { id: 5, name: "Bismil" }, { id: 6, name: "Cermik" }, { id: 7, name: "Cinar" }, { id: 8, name: "Cungus" }, { id: 9, name: "Dicle" }, { id: 10, name: "Egil" }, { id: 11, name: "Ergani" }, { id: 12, name: "Hani" }, { id: 13, name: "Hazro" }, { id: 14, name: "Kocakoy" }, { id: 15, name: "Kulp" }, { id: 16, name: "Lice" }, { id: 17, name: "Silvan" }] },
    { id: 22, name: "Edirne", districts: [{ id: 1, name: "Merkez" }, { id: 2, name: "Enez" }, { id: 3, name: "Havsa" }, { id: 4, name: "Ipsala" }, { id: 5, name: "Kesan" }, { id: 6, name: "Lalapasa" }, { id: 7, name: "Meric" }, { id: 8, name: "Suloglu" }, { id: 9, name: "Uzunkopru" }] },
    { id: 23, name: "Elazig", districts: [{ id: 1, name: "Merkez" }, { id: 2, name: "Agin" }, { id: 3, name: "Alacakaya" }, { id: 4, name: "Aricak" }, { id: 5, name: "Baskil" }, { id: 6, name: "Karakocan" }, { id: 7, name: "Keban" }, { id: 8, name: "Kovancilar" }, { id: 9, name: "Maden" }, { id: 10, name: "Palu" }, { id: 11, name: "Sivrice" }] },
    { id: 24, name: "Erzincan", districts: [{ id: 1, name: "Merkez" }, { id: 2, name: "Cayirli" }, { id: 3, name: "Ilic" }, { id: 4, name: "Kemah" }, { id: 5, name: "Kemaliye" }, { id: 6, name: "Otlukbeli" }, { id: 7, name: "Refahiye" }, { id: 8, name: "Tercan" }, { id: 9, name: "Uzumlu" }] },
    { id: 25, name: "Erzurum", districts: [{ id: 1, name: "Aziziye" }, { id: 2, name: "Palandoken" }, { id: 3, name: "Yakutiye" }, { id: 4, name: "Askale" }, { id: 5, name: "Cat" }, { id: 6, name: "Hinis" }, { id: 7, name: "Horasan" }, { id: 8, name: "Ilica" }, { id: 9, name: "Ispir" }, { id: 10, name: "Karacoban" }, { id: 11, name: "Karayazi" }, { id: 12, name: "Koprukoy" }, { id: 13, name: "Narman" }, { id: 14, name: "Oltu" }, { id: 15, name: "Olur" }, { id: 16, name: "Pasinler" }, { id: 17, name: "Pazaryolu" }, { id: 18, name: "Senkaya" }, { id: 19, name: "Tekman" }, { id: 20, name: "Tortum" }] },
    { id: 26, name: "Eskisehir", districts: [{ id: 1, name: "Odunpazari" }, { id: 2, name: "Tepebasi" }, { id: 3, name: "Alpu" }, { id: 4, name: "Beylikova" }, { id: 5, name: "Cifteler" }, { id: 6, name: "Gunyuzu" }, { id: 7, name: "Han" }, { id: 8, name: "Inonu" }, { id: 9, name: "Mahmudiye" }, { id: 10, name: "Mihalgazi" }, { id: 11, name: "Mihaliccik" }, { id: 12, name: "Saricakaya" }, { id: 13, name: "Seyitgazi" }, { id: 14, name: "Sivrihisar" }] },
    { id: 27, name: "Gaziantep", districts: [{ id: 1, name: "Sahinbey" }, { id: 2, name: "Sehitkamil" }, { id: 3, name: "Araban" }, { id: 4, name: "Islahiye" }, { id: 5, name: "Karkamis" }, { id: 6, name: "Nizip" }, { id: 7, name: "Nurdagi" }, { id: 8, name: "Oguzeli" }, { id: 9, name: "Yavuzeli" }] },
    { id: 28, name: "Giresun", districts: [{ id: 1, name: "Merkez" }, { id: 2, name: "Alucra" }, { id: 3, name: "Bulancak" }, { id: 4, name: "Camoluk" }, { id: 5, name: "Canakci" }, { id: 6, name: "Dereli" }, { id: 7, name: "Dogankent" }, { id: 8, name: "Espiye" }, { id: 9, name: "Eynesil" }, { id: 10, name: "Gorele" }, { id: 11, name: "Guce" }, { id: 12, name: "Kesap" }, { id: 13, name: "Piraziz" }, { id: 14, name: "Sebinkarahisar" }, { id: 15, name: "Tirebolu" }, { id: 16, name: "Yaglidere" }] },
    { id: 29, name: "Gumushane", districts: [{ id: 1, name: "Merkez" }, { id: 2, name: "Kelkit" }, { id: 3, name: "Kose" }, { id: 4, name: "Kurtun" }, { id: 5, name: "Siran" }, { id: 6, name: "Torul" }] },
    { id: 30, name: "Hakkari", districts: [{ id: 1, name: "Merkez" }, { id: 2, name: "Cukurca" }, { id: 3, name: "Derecik" }, { id: 4, name: "Semdinli" }, { id: 5, name: "Yuksekova" }] },
    { id: 31, name: "Hatay", districts: [{ id: 1, name: "Antakya" }, { id: 2, name: "Defne" }, { id: 3, name: "Iskenderun" }, { id: 4, name: "Arsuz" }, { id: 5, name: "Payas" }, { id: 6, name: "Altinozu" }, { id: 7, name: "Belen" }, { id: 8, name: "Dortyol" }, { id: 9, name: "Erzin" }, { id: 10, name: "Hassa" }, { id: 11, name: "Kirikhan" }, { id: 12, name: "Kumlu" }, { id: 13, name: "Reyhanli" }, { id: 14, name: "Samandag" }, { id: 15, name: "Yayladagi" }] },
    { id: 32, name: "Isparta", districts: [{ id: 1, name: "Merkez" }, { id: 2, name: "Aksu" }, { id: 3, name: "Atabey" }, { id: 4, name: "Egirdir" }, { id: 5, name: "Gelendost" }, { id: 6, name: "Gonen" }, { id: 7, name: "Keciborlu" }, { id: 8, name: "Senirkent" }, { id: 9, name: "Sarkikaraagac" }, { id: 10, name: "Sutculer" }, { id: 11, name: "Uluborlu" }, { id: 12, name: "Yalvac" }, { id: 13, name: "Yenisarbademli" }] },
    { id: 33, name: "Mersin", districts: [{ id: 1, name: "Akdeniz" }, { id: 2, name: "Mezitli" }, { id: 3, name: "Toroslar" }, { id: 4, name: "Yenisehir" }, { id: 5, name: "Anamur" }, { id: 6, name: "Aydincik" }, { id: 7, name: "Bozyazi" }, { id: 8, name: "Camliyayla" }, { id: 9, name: "Erdemli" }, { id: 10, name: "Gulnar" }, { id: 11, name: "Mut" }, { id: 12, name: "Silifke" }, { id: 13, name: "Tarsus" }] },
    { id: 34, name: "Istanbul", districts: [{ id: 1, name: "Adalar" }, { id: 2, name: "Arnavutkoy" }, { id: 3, name: "Atasehir" }, { id: 4, name: "Avcilar" }, { id: 5, name: "Bagcilar" }, { id: 6, name: "Bahcelievler" }, { id: 7, name: "Bakirkoy" }, { id: 8, name: "Basaksehir" }, { id: 9, name: "Bayrampasa" }, { id: 10, name: "Besiktas" }, { id: 11, name: "Beykoz" }, { id: 12, name: "Beylikduzu" }, { id: 13, name: "Beyoglu" }, { id: 14, name: "Buyukcekmece" }, { id: 15, name: "Catalca" }, { id: 16, name: "Cekmekoy" }, { id: 17, name: "Esenler" }, { id: 18, name: "Esenyurt" }, { id: 19, name: "Eyupsultan" }, { id: 20, name: "Fatih" }, { id: 21, name: "Gaziosmanpasa" }, { id: 22, name: "Gungoren" }, { id: 23, name: "Kadikoy" }, { id: 24, name: "Kagithane" }, { id: 25, name: "Kartal" }, { id: 26, name: "Kucukcekmece" }, { id: 27, name: "Maltepe" }, { id: 28, name: "Pendik" }, { id: 29, name: "Sancaktepe" }, { id: 30, name: "Sariyer" }, { id: 31, name: "Silivri" }, { id: 32, name: "Sultanbeyli" }, { id: 33, name: "Sultangazi" }, { id: 34, name: "Sile" }, { id: 35, name: "Sisli" }, { id: 36, name: "Tuzla" }, { id: 37, name: "Umraniye" }, { id: 38, name: "Uskudar" }, { id: 39, name: "Zeytinburnu" }] },
    { id: 35, name: "Izmir", districts: [{ id: 1, name: "Buca" }, { id: 2, name: "Bayrakli" }, { id: 3, name: "Bornova" }, { id: 4, name: "Cigli" }, { id: 5, name: "Gaziemir" }, { id: 6, name: "Karabaglar" }, { id: 7, name: "Karsiyaka" }, { id: 8, name: "Konak" }, { id: 9, name: "Narlidere" }, { id: 10, name: "Balcova" }, { id: 11, name: "Aliaga" }, { id: 12, name: "Bayindir" }, { id: 13, name: "Bergama" }, { id: 14, name: "Beydag" }, { id: 15, name: "Cesme" }, { id: 16, name: "Dikili" }, { id: 17, name: "Foca" }, { id: 18, name: "Karaburun" }, { id: 19, name: "Kemalpasa" }, { id: 20, name: "Kinik" }, { id: 21, name: "Kiraz" }, { id: 22, name: "Menderes" }, { id: 23, name: "Menemen" }, { id: 24, name: "Odemis" }, { id: 25, name: "Seferihisar" }, { id: 26, name: "Selcuk" }, { id: 27, name: "Tire" }, { id: 28, name: "Torbali" }, { id: 29, name: "Urla" }] },
    { id: 36, name: "Kars", districts: [{ id: 1, name: "Merkez" }, { id: 2, name: "Akyaka" }, { id: 3, name: "Arpaçay" }, { id: 4, name: "Digor" }, { id: 5, name: "Kagizman" }, { id: 6, name: "Sarikamis" }, { id: 7, name: "Selim" }, { id: 8, name: "Susuz" }] },
    { id: 37, name: "Kastamonu", districts: [{ id: 1, name: "Merkez" }, { id: 2, name: "Abana" }, { id: 3, name: "Agri" }, { id: 4, name: "Arac" }, { id: 5, name: "Asarcik" }, { id: 6, name: "Bozkurt" }, { id: 7, name: "Catalzeytin" }, { id: 8, name: "Cide" }, { id: 9, name: "Daday" }, { id: 10, name: "Devrekani" }, { id: 11, name: "Doganyurt" }, { id: 12, name: "Hanonu" }, { id: 13, name: "Ihsangazi" }, { id: 14, name: "Inebolu" }, { id: 15, name: "Kure" }, { id: 16, name: "Pinarbasi" }, { id: 17, name: "Seydiler" }, { id: 18, name: "Senpazar" }, { id: 19, name: "Taskopru" }, { id: 20, name: "Tosya" }] },
    { id: 38, name: "Kayseri", districts: [{ id: 1, name: "Kocasinan" }, { id: 2, name: "Melikgazi" }, { id: 3, name: "Talas" }, { id: 4, name: "Hacilar" }, { id: 5, name: "Incesu" }, { id: 6, name: "Akkisla" }, { id: 7, name: "Bunyan" }, { id: 8, name: "Develi" }, { id: 9, name: "Felahiye" }, { id: 10, name: "Ozvatan" }, { id: 11, name: "Pinarbasi" }, { id: 12, name: "Sarioglan" }, { id: 13, name: "Sariz" }, { id: 14, name: "Tomarza" }, { id: 15, name: "Yahyali" }, { id: 16, name: "Yesilhisar" }] },
    { id: 39, name: "Kirklareli", districts: [{ id: 1, name: "Merkez" }, { id: 2, name: "Babaeski" }, { id: 3, name: "Demirkoy" }, { id: 4, name: "Kofalcik" }, { id: 5, name: "Luleburgaz" }, { id: 6, name: "Pehlivankoy" }, { id: 7, name: "Pinarhisar" }, { id: 8, name: "Vize" }] },
    { id: 40, name: "Kirsehir", districts: [{ id: 1, name: "Merkez" }, { id: 2, name: "Akpinar" }, { id: 3, name: "Akçakent" }, { id: 4, name: "Boztepe" }, { id: 5, name: "Cicekdagi" }, { id: 6, name: "Kaman" }, { id: 7, name: "Mucur" }] },
    { id: 41, name: "Kocaeli", districts: [{ id: 1, name: "Izmit" }, { id: 2, name: "Gebze" }, { id: 3, name: "Darica" }, { id: 4, name: "Cayirova" }, { id: 5, name: "Dilovasi" }, { id: 6, name: "Basiskele" }, { id: 7, name: "Golcuk" }, { id: 8, name: "Kandira" }, { id: 9, name: "Karamursel" }, { id: 10, name: "Kartepe" }, { id: 11, name: "Derince" }, { id: 12, name: "Korfez" }] },
    { id: 42, name: "Konya", districts: [{ id: 1, name: "Selcuklu" }, { id: 2, name: "Meram" }, { id: 3, name: "Karatay" }, { id: 4, name: "Ahirli" }, { id: 5, name: "Akoren" }, { id: 6, name: "Aksehir" }, { id: 7, name: "Altinekin" }, { id: 8, name: "Beyseyhir" }, { id: 9, name: "Bozkir" }, { id: 10, name: "Cihanbeyli" }, { id: 11, name: "Cumra" }, { id: 12, name: "Derbent" }, { id: 13, name: "Derebucak" }, { id: 14, name: "Doganhisar" }, { id: 15, name: "Emirgazi" }, { id: 16, name: "Eregli" }, { id: 17, name: "Guneysinir" }, { id: 18, name: "Hadim" }, { id: 19, name: "Halkapinar" }, { id: 20, name: "Huyuk" }, { id: 21, name: "Ilgin" }, { id: 22, name: "Kadinhani" }, { id: 23, name: "Karapinar" }, { id: 24, name: "Kulu" }, { id: 25, name: "Sarayonu" }, { id: 26, name: "Seydisehir" }, { id: 27, name: "Taskent" }, { id: 28, name: "Tuzlukcu" }, { id: 29, name: "Yalihuyuk" }, { id: 30, name: "Yunak" }] },
    { id: 43, name: "Kutahya", districts: [{ id: 1, name: "Merkez" }, { id: 2, name: "Altintas" }, { id: 3, name: "Aslanapa" }, { id: 4, name: "Cavdarhisar" }, { id: 5, name: "Domanic" }, { id: 6, name: "Dumlupinar" }, { id: 7, name: "Emet" }, { id: 8, name: "Gediz" }, { id: 9, name: "Hisarcik" }, { id: 10, name: "Pazarlar" }, { id: 11, name: "Simav" }, { id: 12, name: "Saphane" }, { id: 13, name: "Tavsanli" }] },
    { id: 44, name: "Malatya", districts: [{ id: 1, name: "Battalgazi" }, { id: 2, name: "Yesilvadi" }, { id: 3, name: "Akcadag" }, { id: 4, name: "Arapgir" }, { id: 5, name: "Arguvan" }, { id: 6, name: "Darende" }, { id: 7, name: "Dogansehir" }, { id: 8, name: "Doganyol" }, { id: 9, name: "Hekimhan" }, { id: 10, name: "Kuluncak" }, { id: 11, name: "Puturge" }, { id: 12, name: "Yazihan" }] },
    { id: 45, name: "Manisa", districts: [{ id: 1, name: "Sehzadeler" }, { id: 2, name: "Yunusemre" }, { id: 3, name: "Ahmetli" }, { id: 4, name: "Akhisar" }, { id: 5, name: "Alasehir" }, { id: 6, name: "Demirci" }, { id: 7, name: "Golmarmara" }, { id: 8, name: "Gordes" }, { id: 9, name: "Kirkagac" }, { id: 10, name: "Koprubasi" }, { id: 11, name: "Kula" }, { id: 12, name: "Salihli" }, { id: 13, name: "Sarigol" }, { id: 14, name: "Saruhanli" }, { id: 15, name: "Selendi" }, { id: 16, name: "Soma" }, { id: 17, name: "Turgutlu" }] },
    { id: 46, name: "Kahramanmaras", districts: [{ id: 1, name: "Dulkadiroglu" }, { id: 2, name: "Onikisubat" }, { id: 3, name: "Afsin" }, { id: 4, name: "Andirin" }, { id: 5, name: "Caglayancerit" }, { id: 6, name: "Ekinozu" }, { id: 7, name: "Elbistan" }, { id: 8, name: "Goksun" }, { id: 9, name: "Nurhak" }, { id: 10, name: "Pazarcik" }, { id: 11, name: "Turkoglu" }] },
    { id: 47, name: "Mardin", districts: [{ id: 1, name: "Artuklu" }, { id: 2, name: "Dargecit" }, { id: 3, name: "Derik" }, { id: 4, name: "Kiziltepe" }, { id: 5, name: "Mazidagi" }, { id: 6, name: "Midyat" }, { id: 7, name: "Nusaybin" }, { id: 8, name: "Omerli" }, { id: 9, name: "Savur" }, { id: 10, name: "Yesilli" }] },
    { id: 48, name: "Mugla", districts: [{ id: 1, name: "Mentese" }, { id: 2, name: "Bodrum" }, { id: 3, name: "Dalaman" }, { id: 4, name: "Datca" }, { id: 5, name: "Fethiye" }, { id: 6, name: "Kavaklidere" }, { id: 7, name: "Koycegiz" }, { id: 8, name: "Marmaris" }, { id: 9, name: "Milas" }, { id: 10, name: "Ortaca" }, { id: 11, name: "Seydikemer" }, { id: 12, name: "Ula" }, { id: 13, name: "Yatagan" }] },
    { id: 49, name: "Mus", districts: [{ id: 1, name: "Merkez" }, { id: 2, name: "Bulanik" }, { id: 3, name: "Hasköy" }, { id: 4, name: "Korkut" }, { id: 5, name: "Malazgirt" }, { id: 6, name: "Varto" }] },
    { id: 50, name: "Nevsehir", districts: [{ id: 1, name: "Merkez" }, { id: 2, name: "Acigol" }, { id: 3, name: "Avanos" }, { id: 4, name: "Derinkuyu" }, { id: 5, name: "Gulsehir" }, { id: 6, name: "Hacibektai" }, { id: 7, name: "Kozakli" }, { id: 8, name: "Urgup" }] },
    { id: 51, name: "Nigde", districts: [{ id: 1, name: "Merkez" }, { id: 2, name: "Altunhisar" }, { id: 3, name: "Bor" }, { id: 4, name: "Camardi" }, { id: 5, name: "Ciftlik" }, { id: 6, name: "Ulukisla" }] },
    { id: 52, name: "Ordu", districts: [{ id: 1, name: "Altinordu" }, { id: 2, name: "Akkus" }, { id: 3, name: "Aybasti" }, { id: 4, name: "Camas" }, { id: 5, name: "Catalpinar" }, { id: 6, name: "Fatsa" }, { id: 7, name: "Golkoy" }, { id: 8, name: "Gulyali" }, { id: 9, name: "Gurgentepe" }, { id: 10, name: "Ikizce" }, { id: 11, name: "Kabaduz" }, { id: 12, name: "Kabatas" }, { id: 13, name: "Korgan" }, { id: 14, name: "Kumru" }, { id: 15, name: "Mesudiye" }, { id: 16, name: "Persambe" }, { id: 17, name: "Ulubey" }, { id: 18, name: "Unye" }] },
    { id: 53, name: "Rize", districts: [{ id: 1, name: "Merkez" }, { id: 2, name: "Ardesen" }, { id: 3, name: "Camlihemsin" }, { id: 4, name: "Cayeli" }, { id: 5, name: "Derepazari" }, { id: 6, name: "Findikli" }, { id: 7, name: "Guneysu" }, { id: 8, name: "Hemsin" }, { id: 9, name: "Ikizdere" }, { id: 10, name: "Iyidere" }, { id: 11, name: "Kalkandere" }, { id: 12, name: "Pazar" }] },
    { id: 54, name: "Sakarya", districts: [{ id: 1, name: "Adapazari" }, { id: 2, name: "Akyazi" }, { id: 3, name: "Arifiye" }, { id: 4, name: "Erenler" }, { id: 5, name: "Ferizli" }, { id: 6, name: "Geyve" }, { id: 7, name: "Hendek" }, { id: 8, name: "Karapurcek" }, { id: 9, name: "Karasu" }, { id: 10, name: "Kaynarca" }, { id: 11, name: "Kocaali" }, { id: 12, name: "Pamukova" }, { id: 13, name: "Sapanca" }, { id: 14, name: "Serdivan" }, { id: 15, name: "Sogutlu" }, { id: 16, name: "Tarakli" }] },
    { id: 55, name: "Samsun", districts: [{ id: 1, name: "Atakum" }, { id: 2, name: "Canik" }, { id: 3, name: "Ilkadim" }, { id: 4, name: "Tekkeköy" }, { id: 5, name: "Alacam" }, { id: 6, name: "Asarcik" }, { id: 7, name: "Ayvacik" }, { id: 8, name: "Bafra" }, { id: 9, name: "Carsamba" }, { id: 10, name: "Havza" }, { id: 11, name: "Kavak" }, { id: 12, name: "Ladik" }, { id: 13, name: "Ondokuzmayis" }, { id: 14, name: "Salipazari" }, { id: 15, name: "Terme" }, { id: 16, name: "Vezirkopru" }, { id: 17, name: "Yakakent" }] },
    { id: 56, name: "Siirt", districts: [{ id: 1, name: "Merkez" }, { id: 2, name: "Baykan" }, { id: 3, name: "Eruh" }, { id: 4, name: "Kurtalan" }, { id: 5, name: "Pervari" }, { id: 6, name: "Sirvan" }, { id: 7, name: "Tillo" }] },
    { id: 57, name: "Sinop", districts: [{ id: 1, name: "Merkez" }, { id: 2, name: "Ayancik" }, { id: 3, name: "Boyabat" }, { id: 4, name: "Dikmen" }, { id: 5, name: "Duragan" }, { id: 6, name: "Erfelek" }, { id: 7, name: "Gerze" }, { id: 8, name: "Saraydüzü" }, { id: 9, name: "Türkeli" }] },
    { id: 58, name: "Sivas", districts: [{ id: 1, name: "Merkez" }, { id: 2, name: "Akincilar" }, { id: 3, name: "Altinyayla" }, { id: 4, name: "Divrigi" }, { id: 5, name: "Dogansar" }, { id: 6, name: "Gemerek" }, { id: 7, name: "Golova" }, { id: 8, name: "Gurun" }, { id: 9, name: "Hafik" }, { id: 10, name: "Imranli" }, { id: 11, name: "Kangal" }, { id: 12, name: "Koyulhisar" }, { id: 13, name: "Sarkisla" }, { id: 14, name: "Susehri" }, { id: 15, name: "Ulas" }, { id: 16, name: "Yildizeli" }, { id: 17, name: "Zara" }] },
    { id: 59, name: "Tekirdag", districts: [{ id: 1, name: "Suleymanpasa" }, { id: 2, name: "Corlu" }, { id: 3, name: "Cerkezkoy" }, { id: 4, name: "Ergene" }, { id: 5, name: "Hayrabolu" }, { id: 6, name: "Kapaklc" }, { id: 7, name: "Malkara" }, { id: 8, name: "Marmaraereglisi" }, { id: 9, name: "Muratlı" }, { id: 10, name: "Saray" }, { id: 11, name: "Sarky" }] },
    { id: 60, name: "Tokat", districts: [{ id: 1, name: "Merkez" }, { id: 2, name: "Almus" }, { id: 3, name: "Artova" }, { id: 4, name: "Basciftlik" }, { id: 5, name: "Erbaa" }, { id: 6, name: "Niksar" }, { id: 7, name: "Pazar" }, { id: 8, name: "Resadiye" }, { id: 9, name: "Sulusaray" }, { id: 10, name: "Turhal" }, { id: 11, name: "Yesilyurt" }, { id: 12, name: "Zile" }] },
    { id: 61, name: "Trabzon", districts: [{ id: 1, name: "Ortahisar" }, { id: 2, name: "Akcaabat" }, { id: 3, name: "Arakli" }, { id: 4, name: "Arsin" }, { id: 5, name: "Besikduzu" }, { id: 6, name: "Caykara" }, { id: 7, name: "Dernekpazari" }, { id: 8, name: "Duzkoy" }, { id: 9, name: "Hayrat" }, { id: 10, name: "Koprubasi" }, { id: 11, name: "Macka" }, { id: 12, name: "Of" }, { id: 13, name: "Surmene" }, { id: 14, name: "Salpazari" }, { id: 15, name: "Tonya" }, { id: 16, name: "Vakfikebir" }, { id: 17, name: "Yomra" }] },
    { id: 62, name: "Tunceli", districts: [{ id: 1, name: "Merkez" }, { id: 2, name: "Cemisgezek" }, { id: 3, name: "Hozat" }, { id: 4, name: "Mazgirt" }, { id: 5, name: "Nazimiye" }, { id: 6, name: "Ovacik" }, { id: 7, name: "Pertek" }, { id: 8, name: "Pulumur" }] },
    { id: 63, name: "Sanliurfa", districts: [{ id: 1, name: "Haliliye" }, { id: 2, name: "Eyubiye" }, { id: 3, name: "Karakopru" }, { id: 4, name: "Akcakale" }, { id: 5, name: "Birecik" }, { id: 6, name: "Bozova" }, { id: 7, name: "Ceylanpinar" }, { id: 8, name: "Harran" }, { id: 9, name: "Hilvan" }, { id: 10, name: "Siverek" }, { id: 11, name: "Suruc" }, { id: 12, name: "Viransehir" }] },
    { id: 64, name: "Usak", districts: [{ id: 1, name: "Merkez" }, { id: 2, name: "Banaz" }, { id: 3, name: "Esme" }, { id: 4, name: "Karahalli" }, { id: 5, name: "Sivasli" }, { id: 6, name: "Ulubey" }] },
    { id: 65, name: "Van", districts: [{ id: 1, name: "Ipekyolu" }, { id: 2, name: "Tusba" }, { id: 3, name: "Edremit" }, { id: 4, name: "Bahcesaray" }, { id: 5, name: "Baskale" }, { id: 6, name: "Caldiran" }, { id: 7, name: "Catak" }, { id: 8, name: "Ercis" }, { id: 9, name: "Gevas" }, { id: 10, name: "Gurpinar" }, { id: 11, name: "Muradiye" }, { id: 12, name: "Ozalp" }, { id: 13, name: "Saray" }] },
    { id: 66, name: "Yozgat", districts: [{ id: 1, name: "Merkez" }, { id: 2, name: "Akdagmadeni" }, { id: 3, name: "Aydincik" }, { id: 4, name: "Bogazliyan" }, { id: 5, name: "Candir" }, { id: 6, name: "Cayiralan" }, { id: 7, name: "Cekerek" }, { id: 8, name: "Kadisehri" }, { id: 9, name: "Saraykent" }, { id: 10, name: "Sarikaya" }, { id: 11, name: "Sorgun" }, { id: 12, name: "Yenifakili" }, { id: 13, name: "Yerkoyu" }] },
    { id: 67, name: "Zonguldak", districts: [{ id: 1, name: "Merkez" }, { id: 2, name: "Alapli" }, { id: 3, name: "Caycuma" }, { id: 4, name: "Devrek" }, { id: 5, name: "Eregli" }, { id: 6, name: "Gokcebey" }, { id: 7, name: "Kilimli" }, { id: 8, name: "Kozlu" }] },
    { id: 68, name: "Aksaray", districts: [{ id: 1, name: "Merkez" }, { id: 2, name: "Agacoren" }, { id: 3, name: "Eskil" }, { id: 4, name: "Gulagac" }, { id: 5, name: "Guzelyurt" }, { id: 6, name: "Ortakoy" }, { id: 7, name: "Sariyahsi" }] },
    { id: 69, name: "Bayburt", districts: [{ id: 1, name: "Merkez" }, { id: 2, name: "Aydintepe" }, { id: 3, name: "Demirozu" }] },
    { id: 70, name: "Karaman", districts: [{ id: 1, name: "Merkez" }, { id: 2, name: "Ayranci" }, { id: 3, name: "Basyayla" }, { id: 4, name: "Ermenek" }, { id: 5, name: "Kazimkarabekir" }, { id: 6, name: "Sarveliler" }] },
    { id: 71, name: "Kirikkale", districts: [{ id: 1, name: "Merkez" }, { id: 2, name: "Bahsili" }, { id: 3, name: "Baliseyh" }, { id: 4, name: "Celebi" }, { id: 5, name: "Delice" }, { id: 6, name: "Karakecili" }, { id: 7, name: "Keskin" }, { id: 8, name: "Sulakyurt" }, { id: 9, name: "Yahsihan" }] },
    { id: 72, name: "Batman", districts: [{ id: 1, name: "Merkez" }, { id: 2, name: "Besiri" }, { id: 3, name: "Gercus" }, { id: 4, name: "Hasankeyf" }, { id: 5, name: "Kozluk" }, { id: 6, name: "Sason" }] },
    { id: 73, name: "Sirnak", districts: [{ id: 1, name: "Merkez" }, { id: 2, name: "Beytussebap" }, { id: 3, name: "Cizre" }, { id: 4, name: "Guclukonak" }, { id: 5, name: "Idil" }, { id: 6, name: "Silopi" }, { id: 7, name: "Uludere" }] },
    { id: 74, name: "Bartin", districts: [{ id: 1, name: "Merkez" }, { id: 2, name: "Amasra" }, { id: 3, name: "Kurucasile" }, { id: 4, name: "Ulus" }] },
    { id: 75, name: "Ardahan", districts: [{ id: 1, name: "Merkez" }, { id: 2, name: "Cildir" }, { id: 3, name: "Damal" }, { id: 4, name: "Gole" }, { id: 5, name: "Hanak" }, { id: 6, name: "Posof" }] },
    { id: 76, name: "Igdir", districts: [{ id: 1, name: "Merkez" }, { id: 2, name: "Aralik" }, { id: 3, name: "Karakoyunlu" }, { id: 4, name: "Tuzluca" }] },
    { id: 77, name: "Yalova", districts: [{ id: 1, name: "Merkez" }, { id: 2, name: "Altinova" }, { id: 3, name: "Armutlu" }, { id: 4, name: "Cinarcik" }, { id: 5, name: "Ciftlikkoy" }, { id: 6, name: "Termal" }] },
    { id: 78, name: "Karabuk", districts: [{ id: 1, name: "Merkez" }, { id: 2, name: "Eflani" }, { id: 3, name: "Eskipazar" }, { id: 4, name: "Ovacik" }, { id: 5, name: "Safranbolu" }, { id: 6, name: "Yenice" }] },
    { id: 79, name: "Kilis", districts: [{ id: 1, name: "Merkez" }, { id: 2, name: "Elbeyli" }, { id: 3, name: "Musabeyli" }, { id: 4, name: "Polateli" }] },
    { id: 80, name: "Osmaniye", districts: [{ id: 1, name: "Merkez" }, { id: 2, name: "Bahce" }, { id: 3, name: "Duzici" }, { id: 4, name: "Hasanbeyli" }, { id: 5, name: "Kadirli" }, { id: 6, name: "Sumbas" }, { id: 7, name: "Toprakkale" }] },
    { id: 81, name: "Duzce", districts: [{ id: 1, name: "Merkez" }, { id: 2, name: "Akcakoca" }, { id: 3, name: "Cumayeri" }, { id: 4, name: "Cilimli" }, { id: 5, name: "Golyaka" }, { id: 6, name: "Gumusova" }, { id: 7, name: "Kaynasli" }, { id: 8, name: "Yigilca" }] },
  ]
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
