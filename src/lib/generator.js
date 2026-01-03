// ============================================
// DATA GENERATOR (from BACKBONE_DATA_GENERATOR_STABLE_V1)
// ============================================

const FIRST_NAMES = ['James','Sarah','Michael','Emma','David','Olivia','Robert','Sophia','William','Isabella','John','Mia','Richard','Charlotte','Thomas','Amelia','Christopher','Harper','Daniel','Evelyn','Matthew','Abigail','Anthony','Emily','Mark','Elizabeth','Andrew','Sofia','Joshua','Avery','Steven','Ella','Kevin','Scarlett','Brian','Grace','George','Chloe','Edward','Victoria','Alexander','Riley','Benjamin','Aria','Samuel','Lily','Henry','Aurora','Patrick','Zoey'];
const LAST_NAMES = ['Smith','Johnson','Williams','Brown','Jones','Garcia','Miller','Davis','Rodriguez','Martinez','Anderson','Taylor','Thomas','Moore','Jackson','Martin','Lee','Thompson','White','Harris','Sanchez','Clark','Lewis','Robinson','Walker','Young','Allen','King','Wright','Scott','Torres','Hill','Flores','Green','Adams','Nelson','Baker','Hall','Rivera','Campbell','Mitchell','Carter','Roberts','Gomez','Phillips','Evans','Turner','Diaz','Parker'];
const COMPANY_PREFIXES = ['Nova','Quantum','Vertex','Apex','Nexus','Flux','Pulse','Forge','Cipher','Vector','Prism','Atlas','Aero','Helix','Orbit','Tensor','Axiom','Stratos','Kinetic','Photon','Radiant','Stellar','Vantage','Zenith','Lumen','Optic','Arcus','Nimbus','Solace','Vivid'];
const COMPANY_SUFFIXES = ['Labs','AI','Tech','Systems','Analytics','Software','Solutions','Dynamics','Networks','Platforms','Ventures','Digital','Data','Logic','Cloud','Intelligence','Automation','Robotics','Bio','Finance','Pay','Health','Security','Science','Works'];
const FIRM_PREFIXES = ['Sequoia','Andreessen','Benchmark','Accel','Greylock','Lightspeed','Index','Founders','General','Battery','Bessemer','Insight','NEA','Khosla','Union','First','Social','Tiger','Coatue','Thrive','Ribbit','QED','Felicis','Craft','Abstract','Matrix','Emergence','Scale','Point','Foundation'];
const FIRM_SUFFIXES = ['Capital','Ventures','Partners','Fund','Growth','Equity','Catalyst','Investments','Holdings','Management'];

const SECTORS = ['fintech','healthtech','edtech','enterprise_saas','consumer','marketplace','infrastructure','ai_ml','climate','other'];
const STAGES = ['pre_seed','seed','series_a','series_b','series_c','growth'];
const COUNTRIES = ['US','GB','DE','FR','CA','AU','SG','NL','SE','IL'];
const FIRM_TYPES = ['vc','angel_syndicate','family_office','corporate_vc','accelerator'];
const DEAL_STAGES = ['identified','contacted','meeting_scheduled','meeting_held','diligence','term_sheet','committed','closed','dropped'];
const ROUND_TYPES = ['pre_seed','seed','seed_extension','series_a','series_b','bridge'];
const GOAL_TYPES = ['fundraise','revenue','hiring','product','partnership','operational'];

const pick = arr => arr[Math.floor(Math.random() * arr.length)];
const pickN = (arr, n) => [...arr].sort(() => 0.5 - Math.random()).slice(0, n);
const uuid = () => crypto.randomUUID();
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomFloat = (min, max) => Math.random() * (max - min) + min;
const daysAgo = d => new Date(Date.now() - d * 86400000).toISOString();
const daysFromNow = d => new Date(Date.now() + d * 86400000).toISOString();

const genCompanyName = () => `${pick(COMPANY_PREFIXES)}${pick(COMPANY_SUFFIXES)}`;
const genFirmName = () => `${pick(FIRM_PREFIXES)} ${pick(FIRM_SUFFIXES)}`;
const genPersonName = () => ({ firstName: pick(FIRST_NAMES), lastName: pick(LAST_NAMES) });

const HEALTH_PROFILES_BY_STRESS = {
  default: {
    critical: { runwayRange: [0, 3], burnMultiple: [4, 8], activityDays: [45, 90], weight: 0.10 },
    struggling: { runwayRange: [3, 6], burnMultiple: [2.5, 4], activityDays: [20, 45], weight: 0.15 },
    concerning: { runwayRange: [6, 9], burnMultiple: [1.5, 2.5], activityDays: [10, 20], weight: 0.25 },
    stable: { runwayRange: [9, 15], burnMultiple: [1, 2], activityDays: [3, 10], weight: 0.30 },
    healthy: { runwayRange: [15, 24], burnMultiple: [0.5, 1.5], activityDays: [0, 5], weight: 0.20 }
  },
  moderate: {
    critical: { runwayRange: [0, 3], burnMultiple: [4, 8], activityDays: [45, 90], weight: 0.20 },
    struggling: { runwayRange: [3, 6], burnMultiple: [2.5, 4], activityDays: [20, 45], weight: 0.25 },
    concerning: { runwayRange: [6, 9], burnMultiple: [1.5, 2.5], activityDays: [10, 20], weight: 0.25 },
    stable: { runwayRange: [9, 15], burnMultiple: [1, 2], activityDays: [3, 10], weight: 0.20 },
    healthy: { runwayRange: [15, 24], burnMultiple: [0.5, 1.5], activityDays: [0, 5], weight: 0.10 }
  },
  high: {
    critical: { runwayRange: [0, 2], burnMultiple: [5, 10], activityDays: [60, 120], weight: 0.30 },
    struggling: { runwayRange: [2, 5], burnMultiple: [3, 5], activityDays: [30, 60], weight: 0.30 },
    concerning: { runwayRange: [5, 8], burnMultiple: [2, 3], activityDays: [15, 30], weight: 0.25 },
    stable: { runwayRange: [8, 12], burnMultiple: [1.5, 2.5], activityDays: [5, 15], weight: 0.10 },
    healthy: { runwayRange: [12, 18], burnMultiple: [1, 2], activityDays: [0, 7], weight: 0.05 }
  }
};

const pickHealthProfile = (isPortfolio, stressLevel) => {
  if (!isPortfolio) return pick(['stable', 'healthy', 'concerning']);
  const profiles = HEALTH_PROFILES_BY_STRESS[stressLevel] || HEALTH_PROFILES_BY_STRESS.default;
  const r = Math.random();
  let cumulative = 0;
  for (const [profile, config] of Object.entries(profiles)) {
    cumulative += config.weight;
    if (r < cumulative) return profile;
  }
  return 'stable';
};

const STAGE_FINANCIALS = {
  pre_seed: { cash: [50000, 500000], burn: [10000, 50000], mrr: [0, 5000], employees: [1, 5] },
  seed: { cash: [200000, 3000000], burn: [30000, 150000], mrr: [0, 50000], employees: [3, 15] },
  series_a: { cash: [2000000, 15000000], burn: [100000, 500000], mrr: [20000, 300000], employees: [10, 50] },
  series_b: { cash: [10000000, 50000000], burn: [300000, 1500000], mrr: [100000, 1000000], employees: [30, 150] },
  series_c: { cash: [30000000, 150000000], burn: [800000, 4000000], mrr: [500000, 5000000], employees: [80, 400] },
  growth: { cash: [50000000, 300000000], burn: [2000000, 10000000], mrr: [2000000, 20000000], employees: [200, 1000] }
};

const ROUND_SIZES = {
  pre_seed: [100000, 1000000],
  seed: [500000, 4000000],
  seed_extension: [500000, 2000000],
  series_a: [5000000, 20000000],
  series_b: [15000000, 50000000],
  bridge: [2000000, 10000000]
};

export function generateDataset(portfolioCount = 12, stressLevel = 'default') {
  const totalCompanies = Math.round(portfolioCount / 0.2);
  const firmCount = Math.round(totalCompanies * 3);
  const roundCount = Math.round(totalCompanies * 2.5);
  const dealCount = Math.round(roundCount * 11);
  const personCount = Math.round(totalCompanies * 4);
  
  const healthProfiles = HEALTH_PROFILES_BY_STRESS[stressLevel] || HEALTH_PROFILES_BY_STRESS.default;

  // Generate Firms
  const firms = [];
  for (let i = 0; i < firmCount; i++) {
    const firmType = pick(FIRM_TYPES);
    const checkMin = firmType === 'vc' ? randomInt(100000, 5000000) : randomInt(25000, 500000);
    firms.push({
      id: uuid(),
      name: genFirmName(),
      firmType,
      typicalCheckMin: checkMin,
      typicalCheckMax: checkMin * randomInt(2, 10),
    });
  }

  // Generate People
  const people = [];
  const usedEmails = new Set();
  for (let i = 0; i < personCount; i++) {
    const name = genPersonName();
    const role = i < totalCompanies * 1.5 ? 'founder' : i < totalCompanies * 2.5 ? 'investor' : pick(['operator', 'advisor', 'employee']);
    const firm = role === 'investor' ? pick(firms) : null;

    let email;
    let attempt = 0;
    do {
      const suffix = attempt > 0 ? attempt : '';
      const domain = role === 'investor' && firm ? firm.name.toLowerCase().replace(/\s/g, '') : 'gmail';
      email = `${name.firstName.toLowerCase()}.${name.lastName.toLowerCase()}${suffix}@${domain}.com`;
      attempt++;
    } while (usedEmails.has(email));
    usedEmails.add(email);

    people.push({
      id: uuid(),
      firstName: name.firstName,
      lastName: name.lastName,
      email,
      role,
      firm_id: firm?.id || null,
      title: role === 'founder' ? pick(['CEO', 'CTO', 'COO']) : role === 'investor' ? pick(['Partner', 'Principal', 'Associate']) : pick(['VP Engineering', 'Head of Product']),
      lastContactedAt: daysAgo(randomInt(1, 90)),
    });
  }

  const founders = people.filter(p => p.role === 'founder');
  const investors = people.filter(p => p.role === 'investor');

  // Generate Companies
  const companies = [];
  const companyStages = [];
  for (let i = 0; i < portfolioCount; i++) companyStages.push(pick(['seed', 'series_a', 'series_b']));
  for (let i = portfolioCount; i < totalCompanies; i++) companyStages.push(pick(STAGES));

  for (let i = 0; i < totalCompanies; i++) {
    const isPortfolio = i < portfolioCount;
    const stage = companyStages[i];
    const healthProfile = pickHealthProfile(isPortfolio, stressLevel);
    const profile = healthProfiles[healthProfile] || healthProfiles.stable;
    const financials = STAGE_FINANCIALS[stage];

    const burn = randomInt(financials.burn[0], financials.burn[1]);
    const targetRunway = randomFloat(profile.runwayRange[0], profile.runwayRange[1]);
    const cash = Math.round(burn * targetRunway);

    const founder = pick(founders);

    const mrr = randomInt(financials.mrr[0], financials.mrr[1]);

    companies.push({
      id: uuid(),
      name: genCompanyName(),
      isPortfolio,
      founder_id: founder.id,
      foundedAt: daysAgo(randomInt(365, 2000)),
      country: pick(COUNTRIES),
      cashOnHand: cash,
      monthlyBurn: burn,
      mrr,
      revenueGrowthRate: randomFloat(0.05, 0.5),
      grossMargin: randomFloat(0.4, 0.85),
      cacPayback: randomInt(6, 36),
      stage,
      sector: pick(SECTORS),
      employeeCount: randomInt(financials.employees[0], financials.employees[1]),
      lastMaterialUpdate_at: daysAgo(randomInt(profile.activityDays[0], profile.activityDays[1])),
    });
  }

  const portfolioCompanies = companies.filter(c => c.isPortfolio);

  // Generate Rounds
  const rounds = [];
  const companiesToFundraise = [...portfolioCompanies, ...pickN(companies.filter(c => !c.isPortfolio), Math.round(roundCount - portfolioCompanies.length * 1.5))];
  
  for (const company of companiesToFundraise) {
    const numRounds = company.isPortfolio ? randomInt(1, 3) : randomInt(0, 2);
    for (let r = 0; r < numRounds && rounds.length < roundCount; r++) {
      const roundType = pick(ROUND_TYPES);
      const sizeRange = ROUND_SIZES[roundType] || ROUND_SIZES.seed;
      const target = randomInt(sizeRange[0], sizeRange[1]);
      const isActive = r === numRounds - 1 && Math.random() > 0.3;
      const coverage = isActive ? randomFloat(0.1, 0.9) : (Math.random() > 0.2 ? 1.0 : randomFloat(0.5, 1.0));
      
      const hasLead = coverage > 0.3 || Math.random() > 0.5;
      const leadInvestor = hasLead ? pick(investors) : null;

      rounds.push({
        id: uuid(),
        companyId: company.id,
        stage: roundType,
        amount: target,
        closeDate: isActive ? (coverage >= 1 ? daysAgo(randomInt(10, 90)) : daysFromNow(randomInt(30, 120))) : daysAgo(randomInt(30, 365)),
        leadInvestor: hasLead ? `${leadInvestor.firstName} ${leadInvestor.lastName}` : 'TBD',
        company_id: company.id,
        roundType,
        targetAmount: target,
        raisedAmount: Math.round(target * coverage),
        status: isActive ? pick(['active', 'closing']) : (coverage >= 1 ? 'closed' : 'abandoned'),
        startedAt: daysAgo(randomInt(60, 300)),
        targetCloseDate: isActive ? daysFromNow(randomInt(30, 120)) : daysAgo(randomInt(30, 365)),
        leadInvestor_id: leadInvestor?.id || null,
      });
    }
  }

  // Generate Goals
  const goals = [];
  for (const company of portfolioCompanies) {
    const goalCount = randomInt(2, 5);
    for (let g = 0; g < goalCount; g++) {
      const goalType = pick(GOAL_TYPES);
      const target = goalType === 'fundraise' ? randomInt(1000000, 20000000) : goalType === 'revenue' ? randomInt(10000, 500000) : goalType === 'hiring' ? randomInt(2, 20) : 100;
      const progress = randomFloat(0.1, 1.2);
      const daysLeft = randomInt(-30, 180);
      const startDate = daysAgo(randomInt(30, 180));

      goals.push({
        id: uuid(),
        companyId: company.id,
        metric: goalType === 'fundraise' ? 'Close Series A' : goalType === 'revenue' ? `Hit $${(target/1000).toFixed(0)}k MRR` : goalType === 'hiring' ? `Hire ${target} engineers` : 'Launch v2',
        targetValue: target.toString(),
        currentValue: Math.round(target * Math.min(progress, 1)).toString(),
        deadline: daysLeft > 0 ? daysFromNow(daysLeft) : daysAgo(Math.abs(daysLeft)),
        company_id: company.id,
        goalType,
        title: goalType === 'fundraise' ? 'Close Series A' : goalType === 'revenue' ? `Hit $${(target/1000).toFixed(0)}k MRR` : goalType === 'hiring' ? `Hire ${target} engineers` : 'Launch v2',
        startDate,
        targetDate: daysLeft > 0 ? daysFromNow(daysLeft) : daysAgo(Math.abs(daysLeft)),
        lastUpdatedAt: daysAgo(randomInt(0, 14)),
      });
    }
  }

  // Generate Deals
  const deals = [];
  for (const round of rounds) {
    const dealCountForRound = round.status === 'active' ? randomInt(8, 15) : round.status === 'closing' ? randomInt(5, 12) : randomInt(3, 8);

    for (let d = 0; d < dealCountForRound && deals.length < dealCount; d++) {
      const investor = pick(investors);
      const stage = round.status === 'closed' ? pick(['closed', 'committed']) : pick(DEAL_STAGES);
      const recency = stage === 'closed' || stage === 'committed' ? randomInt(30, 180) :
                      stage === 'dropped' ? randomInt(45, 120) :
                      stage === 'diligence' || stage === 'term_sheet' ? randomInt(0, 7) :
                      stage === 'meeting_held' ? randomInt(3, 21) :
                      stage === 'meeting_scheduled' ? randomInt(0, 7) :
                      stage === 'contacted' ? randomInt(7, 30) :
                      randomInt(14, 60);

      deals.push({
        id: uuid(),
        round_id: round.id,
        firm_id: investor.firm_id,
        person_id: investor.id,
        dealStage: stage,
        lastContactDate: daysAgo(recency),
        introducedBy_id: Math.random() > 0.3 ? pick(people).id : null,
        expectedAmount: stage === 'term_sheet' || stage === 'committed' || stage === 'closed' ? randomInt(50000, Math.round(round.targetAmount * 0.4)) : null,
      });
    }
  }

  return { companies, firms, people, rounds, goals, deals };
}
