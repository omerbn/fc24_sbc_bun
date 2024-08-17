
export interface Player {
    id: number,
    timestamp: number,
    formation: string,
    untradeable: boolean,
    assetId: number,
    rating: number,
    itemType: string,
    resourceId: number,
    owners: number,
    discardValue: number,
    itemState: string,
    cardsubtypeid: number,
    lastSalePrice: number,
    injuryType: string,
    injuryGames: number,
    preferredPosition: string,
    contract: number,
    teamid: number,
    rareflag: number,
    playStyle: number,
    leagueId: number,
    assists: number,
    lifetimeAssists: number,
    loans: number,
    loansInfo: {
        loanType: string,
        loanValue: number
    },
    loyaltyBonus: number,
    pile: number,
    nation: number,
    marketDataMinPrice: number,
    marketDataMaxPrice: number,
    resourceGameYear: number,
    guidAssetId: string,
    groups: number[],
    attributeArray: number[],
    statsArray: number[],
    lifetimeStatsArray: number[],
    skillmoves: number,
    weakfootabilitytypecode: number,
    attackingworkrate: number,
    defensiveworkrate: number,
    preferredfoot: number,
    possiblePositions: string[],
    gender: number,
    baseTraits: number[],
    iconTraits: number[],
    academyAttributes: { id: number, totalBonus: 0 }[],

    __name: string,
    __nickname: string,
    __fullname: string,
    __rating: number
}

export interface MD {
    c?: string,
    f: string,
    id: number,
    l: string,
    r: number
}

export interface SupportPlayerInformation {
    assetId: number,
    name: string,
    rating: number,
    id: number
}

export interface PlayerData {
    club: Player[],
    meta_data: Map<number, MD>,
    skipped: Set<number>,
    hinted: Set<Player>
}

export interface PlayersFileFormat {
    itemData: Player[]
}