import React from 'react';
import { FileText } from '@styled-icons/feather/FileText';

import { formatFileSize } from '../lib/file-utils';

import { Box, Flex } from './Grid';
import StyledLink from './StyledLink';

type LocalFilePreviewProps = {
  file: File;
  size: number;
};

const SUPPORTED_IMAGE_REGEX = /^image\/(jpeg|jpg|png|gif|webp)$/;

export default function LocalFilePreview({ file, size }: Readonly<LocalFilePreviewProps>) {
  return (
    <Flex flexDirection="column" alignItems="center">
      <Box width={size} height={size}>
        {SUPPORTED_IMAGE_REGEX.test(file.type) ? (
          <img height="100%" width="100%" src={URL.createObjectURL(file)} alt={file.name} />
        ) : (
          <FileText opacity={0.25} />
        )}
      </Box>

      <p className="mt-2 max-w-full truncate text-center text-xs">
        {file.type === 'application/pdf' ? (
          <StyledLink
            underlineOnHover
            fontWeight="bold"
            hoverColor="black.800"
            color="black.800"
            href={URL.createObjectURL(file)}
            openInNewTab
          >
            {file.name}
          </StyledLink>
        ) : (
          <span className="font-bold text-gray-800">{file.name}</span>
        )}{' '}
        <span className="text-gray-500">({formatFileSize(file.size)})</span>
      </p>
    </Flex>
  );
}
