// Whether a first name reads as a girl's or a boy's, for the default student
// avatar. There is no gender on student records, and the names our schools
// see (Arabic, Persian, South Asian, Turkish and English, in their usual
// spellings) almost always say it plainly. A name that is used for both, or
// that isn't listed, is unknown: better the neutral avatar than a wrong one.
// The exceptions are names used for both that at our schools only women carry
// (Ala, Alaa, Nahid: teachers and a mother); those are listed as girls'.
// Only the first word counts; the next one is usually the father's name.

export type NameGender = 'female' | 'male'

const FEMALE = new Set(
  `aaliyah abeer abigail abir adiba adina afaf afra afrah afsheen ahlam aicha aisha aiza ala alaa aleena alexandra alia
  alice alicia aliya aliyah alya amal amana amanah amanda amani amelia amina aminah amira amna anam angela anisa anna aqsa
  areej arij arwa asala asiya asiyah asma asmaa asra ava aya ayat ayesha aysha aybaniz azada azadeh azza bana banin
  batool batoul batul beenish bella benish bushra charlotte chloe christina clara dalal dalia dana dania darine delaram
  dima dina doaa doha dua duaa duha elena eliana elizabeth
  ella eman emily emma eram esra esraa eva farah fatemeh fatima fatimah fatma fatme fizza ghadeer ghadir ghina grace
  hadeel hafsa hajar hala hana hanaa hanan haniya haniyah hannah hawra hawraa hayat heba hiba hoda huda iman inaya
  isabella isra israa jamila jana janna jannah jannat jannatte jasmine jenna jennifer jessica joelle julia jumana katherine kawsar
  kawthar kauthar khadija khadijah kholoud kulthum laila lama lamia lana lara larissa latifa laura layal layla lea leah
  leila lily lina limar lojain loujain lubna lucy lujain lulwa lyna lynn madina maha mahdiya mahdiyah maheen maisa
  majida mala malaak malak manal maria mariam mariem mariyam marwa maryam maryem masa masooma masuma masoumeh maya
  mayar maysa meryem mia mila mina mira mona muna nada nadia nadine nahid nahida nahla naia najla nargis narges narjes narjis nasrin
  natalie nawal nayla nazanin nesrine nicole nisreen noor nora noura nouran nour nuha olivia qamar rabab rachel raghad
  rahaf rahma rana rania rasha rawan rawya rebecca reem reham rihab riham rim rima rokaya roqaya roqayya rose roya ruba ruby rula
  ruqaya ruqayya ruqayyah rusul sabah sabrina safa safaa safiya safiyya sahar saja sakina sakinah salma samah samar
  samira sana sanaa sara saraa sarah sawsan sayeda sayyeda sayyida selena seyeda shahd shaima shaimaa shereen shirin
  siham sima simaa sofia soha sophia sophie stephanie suha sukaina sukayna sumaya sumayya syeda tala tamara tasneem
  tasnim victoria wafa waliyah warda widad yara yasmeen yasmin yasmine yusra zahra zahraa zahrah zaina zainab zaineb
  zaynab zehra zeina zeinab zena zoe zohra zoya zuhra`.split(/\s+/),
)

const MALE = new Set(
  `aadam aaron abbas abed adam adel adil adnan adrian ahmad ahmed akbar akram alexander ali aly amar ameen ameer amer
  amin amir ammar anas andrew anthony anwar arif asaad asad ashraf ayham ayman ayoub ayub aziz bader badr baqer baqir
  bashir bassam bassel benjamin bilal charles christian christopher dan dani daniel darwish david dylan edward ehab
  elias elijah ethan fadel fadi fadl fahad fahd faisal fares farhan faris fawzi firas fouad gabriel george ghassan
  habib hadi haidar haider haitham hamad hamed hamid hamza hamzah hani haroon harun hasan hashem hashim hasnain hassan
  hassane hatem hayder haytham henry hisham hossain hossein houssam houssein husain husayn hussain hussam hussein
  ibrahim ihab imad imran isa isaac ismael ismail issa jaafar jack jacob jad jafar jalal jamal james jamil jason jawad
  jihad john jonathan joseph joshua julian kamal kareem karim kassem kazem kazim kevin khaled khalid khalil kumail
  kumayl liam logan lucas luke maher mahdi mahmood mahmoud majed majid malik mansour mark marwan matthew mazen mehdi
  michael mohamad mohamed mohammad mohammed mohd mostafa mousa moussa moustafa muhammad muhammed muntadher muntazir
  murtada murtadha murtaza musa mustafa mustapha nabil nader nadim najib naser nasir nasser nathan nizar noah oliver
  omar omer osama owen patrick paul peter qais qasim qassem rabih rami ramez rashid rayyan raza reza riad richard riyad
  robert ryan saad sadek sadeq sadiq saeed said saif sajed sajid sajjad salah saleh salih salim salman samer sami
  samir samuel sayed sayeed sayyed sayyid sebastian shadi shady sharif sultan syed taha talal tamer taqi tarek tarik
  tariq thomas usama wael waleed walid wassim william yahya yaseen yaser yasin yassin yasser younes younis yousef
  yousif youssef yousuf yusuf zaid zakaria zakariya zakariyya zayd zayn ziad ziyad`.split(/\s+/),
)

/** "Fatima-Zahra El Amine" → "fatima": lowercase, accents and punctuation gone. */
export function firstNameKey(name: string | null | undefined): string {
  const first = (name ?? '').trim().split(/[\s-]+/)[0] ?? ''
  return first
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z]/g, '')
}

/** 'female' or 'male' when the first name says so, else null. */
export function nameGender(name: string | null | undefined): NameGender | null {
  const key = firstNameKey(name)
  if (!key) return null
  if (FEMALE.has(key)) return 'female'
  if (MALE.has(key)) return 'male'
  // Abdullah, Abdulrahman, Abdel Karim…: always a boy's name.
  if (key.startsWith('abd')) return 'male'
  return null
}

/** For tests: the two lists never share a name. */
export const NAME_LISTS = { female: FEMALE, male: MALE }
