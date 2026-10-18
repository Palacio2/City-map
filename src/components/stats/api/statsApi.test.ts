import {beforeEach,it,expect,vi} from 'vitest';
import {fetchDashboardData,updateUserTime,trackDistrictVisit,registerComparisonEvent} from './statsApi';
import type { TransformedDistrict } from '@utils/dataTransformers';
const mock=vi.hoisted(()=>({getSession:vi.fn(),rpc:vi.fn(),from:vi.fn()}));
vi.mock('@supabaseClient',()=>({supabase:{auth:{getSession:mock.getSession},rpc:mock.rpc,from:mock.from}}));
beforeEach(()=>{vi.resetAllMocks();mock.getSession.mockResolvedValue({data:{session:{user:{id:'fixture'}}}});mock.rpc.mockResolvedValue({error:null});});
it('activity wrappers send only location fields and skip signed-out writes',async()=>{
  const district={id:'district',city:'City',country:'PL',privateField:'discard'} as unknown as TransformedDistrict;
  await trackDistrictVisit(district);await registerComparisonEvent([district]);
  expect(mock.rpc).toHaveBeenNthCalledWith(1,'track_district_visit',{district_data:{id:'district',city:'City',country:'PL'}});
  expect(mock.rpc).toHaveBeenNthCalledWith(2,'register_comparison_event',{districts_payload:[{id:'district',city:'City',country:'PL'}]});
  mock.getSession.mockResolvedValue({data:{session:null}});
  await trackDistrictVisit(district);await registerComparisonEvent([district]);
  expect(mock.rpc).toHaveBeenCalledTimes(2);
});
it('skips invalid elapsed time and signed-out sessions',async()=>{
  for(const value of [NaN,Infinity,-1000,0,999]) await updateUserTime(value);
  expect(mock.getSession).not.toHaveBeenCalled();
  mock.getSession.mockResolvedValue({data:{session:null}});
  await updateUserTime(300_000);expect(mock.rpc).not.toHaveBeenCalled();
});

function dashboardFixture(failed?: string) {
  const failure = {message:'Database unavailable',code:'XX000'};
  const result = (key: string) => ({data:key==='user_stats'?null:[],error:key===failed?failure:null});
  mock.rpc.mockImplementation(async (key: string) => result(key));
  mock.from.mockImplementation((key: string) => ({select:()=>({eq:(_column: string,user: string)=>{
    expect(user).toBe('fixture');
    return key==='user_stats'?{maybeSingle:async()=>result(key)}:Promise.resolve(result(key));
  }})}));
  return failure;
}
it.each(['get_weekly_activity_stats','get_popular_districts_stats','user_tracked_districts','user_stats'])('rejects a failed %s query instead of returning an empty dashboard',async key=>{
  const failure=dashboardFixture(key);
  await expect(fetchDashboardData()).rejects.toBe(failure);
});
it('allows genuinely empty statistics and scopes queries to the authenticated user',async()=>{
  dashboardFixture();
  await expect(fetchDashboardData()).resolves.toEqual({stats:null,weeklyActivity:[],popularDistricts:[],trackedDistricts:[]});
  expect(mock.rpc).toHaveBeenCalledWith('get_weekly_activity_stats',{uid:'fixture'});
});
it('does not query dashboard data without a session',async()=>{
  mock.getSession.mockResolvedValue({data:{session:null}});
  await expect(fetchDashboardData()).rejects.toThrow('Unauthorized');
  expect(mock.rpc).not.toHaveBeenCalled();expect(mock.from).not.toHaveBeenCalled();
});
it('reports whole seconds and caps delayed timers at the server limit',async()=>{
  await updateUserTime(30_999);await updateUserTime(1_200_000);
  expect(mock.rpc).toHaveBeenNthCalledWith(1,'update_user_time',{seconds:30});
  expect(mock.rpc).toHaveBeenNthCalledWith(2,'update_user_time',{seconds:600});
});
it('propagates database failure to the caller instead of reporting successful tracking',async()=>{
  const failure=new Error('Unavailable');mock.rpc.mockResolvedValue({error:failure});
  await expect(updateUserTime(30_000)).rejects.toBe(failure);
});
