import { Box, Skeleton, Stack } from '@mui/material';

export default function DirectoryCardSkeleton() {
  return (
    <Box
      sx={{
        borderRadius: 3,
        overflow: 'hidden',
        border: '1px solid',
        borderColor: 'grey.100',
        bgcolor: 'background.paper',
      }}
    >
      <Skeleton variant="rectangular" sx={{ aspectRatio: '4 / 3', width: '100%' }} />
      <Box sx={{ p: 2 }}>
        <Skeleton width="80%" height={22} />
        <Skeleton width="50%" height={18} sx={{ mt: 0.5 }} />
        <Skeleton width="35%" height={14} sx={{ mt: 1 }} />
        <Stack direction="row" spacing={0.75} sx={{ mt: 1.25 }}>
          <Skeleton variant="rounded" width={60} height={22} />
          <Skeleton variant="rounded" width={50} height={22} />
        </Stack>
      </Box>
    </Box>
  );
}
