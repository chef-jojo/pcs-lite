import { SettingIcon } from '@pcs/icons';
import { Box, Flex, styled, Text, Toggle } from '@pcs/ui';
import { useAtom } from 'jotai';
import { useEffect, useMemo, useState } from 'react';
import { UNSUPPORTED_LIST_URLS } from '~/config/list';
import { useTokenListSWR } from '~/hooks/useTokenList';
import { useTranslation } from '~/hooks/useTranslation';
import { $listActiveListUrls } from '~/state/list';
import Logo from '../logo/Logo';

const RowWrapper = styled(Flex, {
  border: 'solid 1px',
  transition: '200ms',
  alignItems: 'center',
  padding: '1rem',
  borderRadius: 20,
  bc: 'transparent',
  gap: '$3',
  borderColor: '$tertiary',
  variants: {
    active: {
      true: {
        bc: '$success',
        borderColor: '$success',
      },
    },
  },
});

export function ManageList() {
  // const [listByUrls] = useAtom($listByUrls);
  const [activeListUrls, setActiveListUrls] = useAtom(
    $listActiveListUrls,
  );
  const { data: listByUrls = {} } = useTokenListSWR();

  const [activeCopy, setActiveCopy] = useState<
    string[] | undefined
  >();

  useEffect(() => {
    if (!activeCopy && activeListUrls) {
      setActiveCopy(activeListUrls);
    }
  }, [activeCopy, activeListUrls]);

  const sortedLists = useMemo(() => {
    const listUrls = Object.keys(listByUrls);
    return listUrls
      .filter((listUrl) => {
        // only show loaded lists, hide unsupported lists
        return (
          Boolean(listByUrls[listUrl]) &&
          !UNSUPPORTED_LIST_URLS.includes(listUrl)
        );
      })
      .sort((u1, u2) => {
        const l1 = listByUrls[u1];
        const l2 = listByUrls[u2];

        // first filter on active lists
        if (activeCopy?.includes(u1) && !activeCopy?.includes(u2)) {
          return -1;
        }
        if (!activeCopy?.includes(u1) && activeCopy?.includes(u2)) {
          return 1;
        }

        if (l1 && l2) {
          return l1.name.toLowerCase() < l2.name.toLowerCase()
            ? -1
            : l1.name.toLowerCase() === l2.name.toLowerCase()
            ? 0
            : 1;
        }
        if (l1) return -1;
        if (l2) return 1;
        return 0;
      });
  }, [listByUrls, activeCopy]);

  console.log(sortedLists);
  const { t } = useTranslation();

  return (
    <Box css={{ overflow: 'auto' }}>
      {sortedLists.map((listUrl) => {
        const list = listByUrls[listUrl];
        if (!list) {
          return null;
        }
        return (
          <RowWrapper key={listUrl}>
            <Logo
              width="40px"
              height="40px"
              srcs={list.logoURI ? [list.logoURI] : []}
              alt={`${list.name} list logo`}
            />
            <Box>
              <Text bold>{list.name}</Text>
              <Flex align="center" css={{ mt: '$1' }} gap="2">
                <Text
                  size="sm"
                  css={{
                    mr: '6px',
                    textTransform: 'lowercase',
                  }}
                >
                  {list.tokens.length} {t('Tokens')}
                </Text>
                <span>
                  <SettingIcon color="text" width="12px" />
                </span>
              </Flex>
            </Box>
            <Toggle
              checked={activeListUrls.includes(listUrl)}
              onCheckedChange={(checked) => {
                if (checked) {
                  setActiveListUrls([...activeListUrls, listUrl]);
                } else {
                  setActiveListUrls(
                    activeListUrls.filter((u) => u !== listUrl),
                  );
                }
              }}
            />
          </RowWrapper>
        );
      })}
    </Box>
  );
}
