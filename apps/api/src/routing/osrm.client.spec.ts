import { OsrmClient } from './osrm.client.js';
import { RouteRequestDto } from './dto/route-request.dto.js';

describe('OsrmClient', () => {
  const originalBaseUrl = process.env.OSRM_BASE_URL;

  afterEach(() => {
    vi.unstubAllGlobals();

    if (originalBaseUrl === undefined) {
      delete process.env.OSRM_BASE_URL;
    } else {
      process.env.OSRM_BASE_URL = originalBaseUrl;
    }
  });

  it('maps the provider response to a RouteResult', async () => {
    process.env.OSRM_BASE_URL = 'https://routing.example.test';
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        code: 'Ok',
        routes: [
          {
            distance: 4200,
            duration: 780,
            geometry: {
              type: 'LineString',
              coordinates: [],
            },
          },
        ],
      }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const result = await new OsrmClient().getRoute(
      new RouteRequestDto(23.7937, 90.4066, 23.7806, 90.4071),
    );

    expect(result).toEqual({
      distanceMeter: 4200,
      durationSecond: 780,
      geometry: {
        type: 'LineString',
        coordinates: [],
      },
    });

    const [requestUrl] = fetchMock.mock.calls[0] as [URL];
    expect(requestUrl.origin).toBe('https://routing.example.test');
    expect(requestUrl.pathname).toBe(
      '/route/v1/driving/90.4066,23.7937;90.4071,23.7806',
    );
    expect(requestUrl.searchParams.get('overview')).toBe('full');
    expect(requestUrl.searchParams.get('geometries')).toBe('geojson');
  });

  it('rejects route requests when OSRM_BASE_URL is missing', async () => {
    delete process.env.OSRM_BASE_URL;

    await expect(
      new OsrmClient().getRoute(
        new RouteRequestDto(23.7937, 90.4066, 23.7806, 90.4071),
      ),
    ).rejects.toThrow('OSRM_BASE_URL is required');
  });
});
